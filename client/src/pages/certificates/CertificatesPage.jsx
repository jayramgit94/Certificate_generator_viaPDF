import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, Play, Search, XCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import { PageLoader } from "../../components/ui/Spinner";
import api from "../../lib/api";
import { downloadBlob, formatDate } from "../../lib/utils";

export default function CertificatesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [generateModal, setGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    templateId: "",
    recipientBatchId: "",
  });
  const [previewCert, setPreviewCert] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["certificates", page, search, statusFilter],
    queryFn: () =>
      api
        .get("/certificates", {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data.data),
  });

  const { data: templates } = useQuery({
    queryKey: ["templates-list"],
    queryFn: () =>
      api
        .get("/templates", { params: { limit: 100, status: "active" } })
        .then((r) => r.data.data?.templates || []),
  });

  const { data: batches } = useQuery({
    queryKey: ["batches-list"],
    queryFn: () =>
      api
        .get("/recipients", { params: { limit: 100 } })
        .then((r) => r.data.data?.batches || []),
  });

  const generateMutation = useMutation({
    mutationFn: (formData) =>
      api.post("/certificates/generate-batch", {
        templateId: formData.templateId,
        batchId: formData.recipientBatchId,
      }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setGenerateModal(false);
      if (data.data?.success === 0 && data.data?.total > 0) {
        const firstError = data.data?.errors?.[0]?.error || "Unknown error";
        toast.error(`Failed to generate certificates: ${firstError}`);
      } else {
        toast.success(data.message || `Certificates generated!`);
      }
    },
    onError: (err) => {
      const errData = err.response?.data;
      const firstError = errData?.data?.errors?.[0]?.error;
      toast.error(
        firstError ||
          errData?.error?.message ||
          errData?.message ||
          "Failed to generate certificates",
      );
    },
  });

  const downloadCert = async (certId) => {
    try {
      const response = await api.get(`/certificates/${certId}/download`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `certificate-${certId}.pdf`);
      toast.success("Certificate downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const revokeMutation = useMutation({
    mutationFn: (id) =>
      api.put(`/certificates/${id}/revoke`, { reason: "Revoked by admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate revoked");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to revoke certificate",
      );
    },
  });

  if (isLoading) return <PageLoader />;

  const certificates = data?.certificates || [];
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
            Certificates
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Generate, manage, and distribute certificates
          </p>
        </div>
        <Button onClick={() => setGenerateModal(true)}>
          <Play className="w-4 h-4" />
          Generate Certificates
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or cert ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { label: "All Status", value: "" },
            { label: "Generated", value: "generated" },
            { label: "Sent", value: "sent" },
            { label: "Revoked", value: "revoked" },
          ]}
          className="w-full sm:w-40"
        />
      </div>

      {/* Table */}
      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Generate certificates by selecting a template and recipient batch."
          action={
            <Button onClick={() => setGenerateModal(true)}>
              <Play className="w-4 h-4" />
              Generate
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
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {certificates.map((cert) => (
                    <tr
                      key={cert._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Award className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-mono font-medium text-gray-900">
                              {cert.certificateId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {cert.recipientName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cert.recipientEmail}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cert.template?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            cert.status === "generated"
                              ? "success"
                              : cert.status === "revoked"
                                ? "danger"
                                : "primary"
                          }
                        >
                          {cert.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(cert.issueDate || cert.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => downloadCert(cert._id)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {cert.status !== "revoked" && (
                            <button
                              onClick={() => revokeMutation.mutate(cert._id)}
                              className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
                              title="Revoke"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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
            {certificates.map((cert) => (
              <Card key={cert._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cert.recipientName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {cert.recipientEmail}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      cert.status === "generated"
                        ? "success"
                        : cert.status === "revoked"
                          ? "danger"
                          : "primary"
                    }
                  >
                    {cert.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono">{cert.certificateId}</span>
                  <span>{formatDate(cert.issueDate || cert.createdAt)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => downloadCert(cert._id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  {cert.status !== "revoked" && (
                    <button
                      onClick={() => revokeMutation.mutate(cert._id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-danger-600 bg-danger-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  )}
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

      {/* Generate Modal */}
      <Modal
        isOpen={generateModal}
        onClose={() => setGenerateModal(false)}
        title="Generate Certificates"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateMutation.mutate(generateForm);
          }}
          className="space-y-5"
        >
          <Select
            label="Template"
            value={generateForm.templateId}
            onChange={(v) =>
              setGenerateForm({ ...generateForm, templateId: v })
            }
            options={(templates || []).map((t) => ({
              label: t.name,
              value: t._id,
            }))}
            placeholder="Select a template..."
          />
          <Select
            label="Recipient Batch"
            value={generateForm.recipientBatchId}
            onChange={(v) =>
              setGenerateForm({ ...generateForm, recipientBatchId: v })
            }
            options={(batches || []).map((b) => ({
              label: `${b.batchName || b.originalFileName} (${b.summary?.valid || 0} recipients)`,
              value: b._id,
            }))}
            placeholder="Select a batch..."
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setGenerateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                generateMutation.isPending ||
                !generateForm.templateId ||
                !generateForm.recipientBatchId
              }
            >
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
