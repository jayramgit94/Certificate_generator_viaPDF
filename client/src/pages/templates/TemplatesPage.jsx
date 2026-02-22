import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Edit,
  FileImage,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import api from "../../lib/api";
import { formatDate, truncate } from "../../lib/utils";

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const fileInputRef = useRef(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "course",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["templates", page, search],
    queryFn: () =>
      api
        .get("/templates", {
          params: { page, limit: 12, search: search || undefined },
        })
        .then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (formData) =>
      api.post("/templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCreateModal(false);
      setNewTemplate({ name: "", description: "", category: "course" });
      setTemplateFile(null);
      toast.success("Template created!");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to create template",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setDeleteModal(null);
      toast.success("Template deleted");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to delete template",
      );
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => api.post(`/templates/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template duplicated!");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to duplicate template",
      );
    },
  });

  if (isLoading) return <PageLoader />;

  const templates = data?.templates || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your certificate templates
          </p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title="No templates yet"
          description="Create your first certificate template to get started."
          action={
            <Button onClick={() => setCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {templates.map((t) => (
              <Card
                key={t._id}
                className="group hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Preview */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
                  {t.backgroundImage ? (
                    <img
                      src={t.backgroundImage}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-12 h-12 text-gray-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Link
                        to={`/templates/${t._id}/edit`}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-700" />
                      </Link>
                      <button
                        onClick={() => duplicateMutation.mutate(t._id)}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(t)}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {t.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {truncate(t.description, 40) || "No description"}
                      </p>
                    </div>
                    <Badge
                      variant={t.status === "active" ? "success" : "warning"}
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{t.category}</span>
                    <span>&middot;</span>
                    <span>{formatDate(t.updatedAt || t.createdAt)}</span>
                  </div>
                </CardContent>
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

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Template"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!templateFile) {
              toast.error("Please upload a PDF or image file");
              return;
            }
            const fd = new FormData();
            fd.append("file", templateFile);
            fd.append("name", newTemplate.name);
            fd.append("description", newTemplate.description);
            fd.append("category", newTemplate.category);
            createMutation.mutate(fd);
          }}
          className="space-y-4"
        >
          <Input
            label="Template Name"
            placeholder="e.g., Course Completion Certificate"
            value={newTemplate.name}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, name: e.target.value })
            }
            required
          />
          <Input
            label="Description"
            placeholder="Brief description..."
            value={newTemplate.description}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, description: e.target.value })
            }
          />
          <div>
            <label className="label">Category</label>
            <select
              value={newTemplate.category}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, category: e.target.value })
              }
              className="input"
            >
              <option value="course">Course Completion</option>
              <option value="achievement">Achievement</option>
              <option value="participation">Participation</option>
              <option value="award">Award</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="label">Certificate Template File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setTemplateFile(e.target.files[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
            >
              {templateFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <FileImage className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{templateFile.name}</span>
                  <span className="text-gray-400">
                    ({(templateFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium">
                    Click to upload PDF or Image
                  </span>
                  <span className="text-xs text-gray-400">
                    PDF, PNG, JPG, WebP (max 10MB)
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Template"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteModal._id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
