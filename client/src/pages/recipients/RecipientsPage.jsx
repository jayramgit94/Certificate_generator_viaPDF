import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Spinner, { InlineLoader, PageLoader } from "../../components/ui/Spinner";
import api from "../../lib/api";
import {
  getUploadLimitText,
  UPLOAD_LIMITS,
  validateUploadFile,
} from "../../lib/uploadLimits";
import { downloadBlob, formatDate, formatNumber } from "../../lib/utils";

export default function RecipientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [uploadModal, setUploadModal] = useState(false);
  const [viewBatch, setViewBatch] = useState(null);
  const [viewBatchLoading, setViewBatchLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [batchCertificates, setBatchCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [downloadTargetCertId, setDownloadTargetCertId] = useState(null);
  const recipientsPolicy = UPLOAD_LIMITS.recipients;

  const fetchAndViewBatch = async (batch) => {
    setViewBatchLoading(true);
    setLoadingCertificates(true);
    try {
      const [batchRes, certRes] = await Promise.all([
        api.get(`/recipients/${batch._id}`),
        api.get("/certificates", {
          params: {
            page: 1,
            limit: 500,
            recipientBatch: batch._id,
          },
        }),
      ]);

      setViewBatch(batchRes.data.data);
      setBatchCertificates(certRes.data.data?.certificates || []);
    } catch {
      // Fallback to list data (records may be empty)
      setViewBatch(batch);
      setBatchCertificates([]);
    } finally {
      setViewBatchLoading(false);
      setLoadingCertificates(false);
    }
  };

  const findCertificateForRecord = (record) => {
    if (!record) return null;

    const email = String(record.email || "").trim().toLowerCase();
    const name = String(record.name || "").trim().toLowerCase();

    const exact = batchCertificates.find((cert) => {
      const certEmail = String(cert.recipientEmail || "").trim().toLowerCase();
      const certName = String(cert.recipientName || "").trim().toLowerCase();
      return certEmail === email && certName === name;
    });

    if (exact) return exact;

    return batchCertificates.find((cert) => {
      const certEmail = String(cert.recipientEmail || "").trim().toLowerCase();
      return certEmail === email;
    });
  };

  const downloadCertificateForRecord = async (record) => {
    const certificate = findCertificateForRecord(record);

    if (!certificate?._id) {
      toast.error("No generated certificate found for this recipient yet");
      return;
    }

    setDownloadTargetCertId(certificate._id);
    try {
      const response = await api.get(`/certificates/${certificate._id}/download`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `${certificate.certificateId || "certificate"}.pdf`);
      toast.success("Certificate downloaded");
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to download certificate",
      );
    } finally {
      setDownloadTargetCertId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["recipients", page, search],
    queryFn: () =>
      api
        .get("/recipients", {
          params: { page, limit: 10, search: search || undefined },
        })
        .then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/recipients/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      setUploadModal(false);

      const total = data.data?.summary?.total || 0;
      const warningCount = data.data?.importInsights?.warningCount || 0;

      if (warningCount > 0) {
        toast.success(
          `${total} recipients uploaded with ${warningCount} header-mapping warning(s).`,
          { duration: 5000 },
        );
      } else {
        toast.success(`${total} recipients uploaded!`);
      }
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to upload recipients",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/recipients/${id}`),
    onMutate: (id) => {
      setDeleteTargetId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      setDeleteModal(null);
      toast.success("Batch deleted");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to delete batch",
      );
    },
    onSettled: () => {
      setDeleteTargetId(null);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ batchId, recordId, data }) =>
      api.put(`/recipients/${batchId}/records/${recordId}`, data),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      setViewBatch(data.data);
      setEditingRecord(null);
      toast.success("Record updated");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to update record",
      );
    },
  });

  const startEditing = (record) => {
    setEditingRecord(record._id);
    setEditForm({ name: record.name, email: record.email });
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditForm({ name: "", email: "" });
  };

  const saveEdit = (batchId, recordId) => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    updateRecordMutation.mutate({
      batchId,
      recordId,
      data: { name: editForm.name.trim(), email: editForm.email.trim() },
    });
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      const selected = acceptedFiles[0];
      if (!selected) return;

      const validation = validateUploadFile(selected, recipientsPolicy);
      if (!validation.ok) {
        toast.error(`${validation.reason} ${validation.nextStep}`);
        return;
      }

      uploadMutation.mutate(selected);
    },
    [recipientsPolicy, uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const firstError = rejections?.[0]?.errors?.[0]?.message;
      if (firstError) {
        toast.error(firstError);
      }
    },
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/json": [".json"],
    },
    maxFiles: 1,
    maxSize: recipientsPolicy.maxSizeMb * 1024 * 1024,
  });

  if (isLoading) return <PageLoader />;

  const batches = data?.batches || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">
            Recipients
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Upload and manage recipient batches
          </p>
        </div>
        <Button onClick={() => setUploadModal(true)}>
          <Upload className="w-4 h-4" />
          Upload Recipients
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Batches table */}
      {batches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No recipients uploaded"
          description="Upload a CSV, XLSX, or JSON file to add recipients."
          action={
            <Button onClick={() => setUploadModal(true)}>
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invalid</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {batches.map((batch) => (
                    <tr key={batch._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{batch.batchName || batch.originalFileName}</p>
                            <p className="text-xs text-gray-400">{batch.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatNumber(batch.summary?.total || 0)}</td>
                      <td className="px-6 py-4"><span className="text-sm text-success-600 font-medium">{batch.summary?.valid || 0}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-danger-600 font-medium">{batch.summary?.invalid || 0}</span></td>
                      <td className="px-6 py-4"><Badge variant={batch.status === "active" ? "success" : "warning"}>{batch.status}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(batch.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => fetchAndViewBatch(batch)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteModal(batch)} className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-danger-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {batches.map((batch) => (
              <Card key={batch._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{batch.batchName || batch.originalFileName}</p>
                      <p className="text-xs text-gray-400">{batch.source}</p>
                    </div>
                  </div>
                  <Badge variant={batch.status === "active" ? "success" : "warning"}>{batch.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-gray-900">{formatNumber(batch.summary?.total || 0)}</p>
                    <p className="text-[10px] text-gray-500">Total</p>
                  </div>
                  <div className="bg-success-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-success-700">{batch.summary?.valid || 0}</p>
                    <p className="text-[10px] text-gray-500">Valid</p>
                  </div>
                  <div className="bg-danger-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-danger-600">{batch.summary?.invalid || 0}</p>
                    <p className="text-[10px] text-gray-500">Invalid</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(batch.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => fetchAndViewBatch(batch)} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"><Eye className="w-3.5 h-3.5" />View</button>
                    <button onClick={() => setDeleteModal(batch)} className="flex items-center gap-1.5 text-xs font-medium text-danger-600 bg-danger-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Upload Recipients"
        size="md"
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-400 bg-primary-50"
              : "border-gray-300 hover:border-primary-300 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {isDragActive
              ? "Drop your file here..."
              : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {getUploadLimitText(recipientsPolicy)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Required columns: <strong>name</strong>, <strong>email</strong>
          </p>
        </div>
        {uploadMutation.isPending && (
          <div className="mt-4 text-center">
            <InlineLoader label="Uploading and processing..." />
          </div>
        )}
      </Modal>

      {/* View Batch Modal */}
      <Modal
        isOpen={!!viewBatch}
        onClose={() => {
          setViewBatch(null);
          setBatchCertificates([]);
        }}
        title={`Batch: ${viewBatch?.batchName || "Details"}`}
        size="lg"
      >
        {viewBatch && (
          <div className="space-y-4">
            {loadingCertificates && (
              <p className="text-xs text-gray-500">Loading generated certificates...</p>
            )}
            {(viewBatch.importInsights?.warningCount || 0) > 0 && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
                <p className="text-sm font-medium text-warning-800">
                  Mapping warnings: {viewBatch.importInsights.warningCount}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-warning-700 list-disc list-inside">
                  {(viewBatch.importInsights.warnings || [])
                    .slice(0, 5)
                    .map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {viewBatch.summary?.total || 0}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-success-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success-700">
                  {viewBatch.summary?.valid || 0}
                </p>
                <p className="text-xs text-gray-500">Valid</p>
              </div>
              <div className="bg-danger-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-danger-600">
                  {viewBatch.summary?.invalid || 0}
                </p>
                <p className="text-xs text-gray-500">Invalid</p>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Name
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Email
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(viewBatch.records || []).map((rec) => (
                    <tr key={rec._id}>
                      {editingRecord === rec._id ? (
                        <>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="input text-sm py-1 px-2 w-full"
                              placeholder="Name"
                              autoFocus
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                              className="input text-sm py-1 px-2 w-full"
                              placeholder="Email"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            {rec.isValid !== false ? (
                              <CheckCircle className="w-4 h-4 text-success-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-danger-500" />
                            )}
                          </td>
                          <td className="py-1.5 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => saveEdit(viewBatch._id, rec._id)}
                                disabled={updateRecordMutation.isPending}
                                className="p-1 text-success-600 hover:bg-success-50 rounded transition-colors"
                                title="Save"
                              >
                                {updateRecordMutation.isPending ? (
                                  <Spinner size="sm" className="text-success-600" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-3 text-gray-900">
                            {rec.name}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {rec.email}
                          </td>
                          <td className="py-2.5 px-3">
                            {rec.isValid !== false ? (
                              <CheckCircle className="w-4 h-4 text-success-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-danger-500" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditing(rec)}
                                className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadCertificateForRecord(rec)}
                                disabled={downloadTargetCertId === findCertificateForRecord(rec)?._id}
                                className="p-1 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                                title="Download Certificate"
                              >
                                {downloadTargetCertId === findCertificateForRecord(rec)?._id ? (
                                  <Spinner size="sm" className="text-success-600" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Batch"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Delete batch <strong>{deleteModal?.batchName}</strong> with{" "}
          {deleteModal?.summary?.total || 0} recipients? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteModal._id)}
            loading={deleteMutation.isPending}
            disabled={deleteTargetId !== null && deleteTargetId !== deleteModal?._id}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
