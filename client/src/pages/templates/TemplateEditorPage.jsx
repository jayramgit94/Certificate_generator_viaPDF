import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Save,
  Settings,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card, { CardContent, CardHeader } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { InlineLoader, PageLoader } from "../../components/ui/Spinner";
import api, { getApiErrorInfo, getUploadUrl } from "../../lib/api";
import {
  getUploadLimitText,
  UPLOAD_LIMITS,
  validateUploadFile,
} from "../../lib/uploadLimits";

const isImageTemplate = (tpl) =>
  tpl?.fileType === "image" ||
  (typeof tpl?.templateMimeType === "string" &&
    tpl.templateMimeType.startsWith("image/"));

const isPdfTemplate = (tpl) =>
  tpl?.fileType === "pdf" ||
  String(tpl?.templateMimeType || "").toLowerCase().includes("pdf") ||
  /\.pdf(\?.*)?$/i.test(String(tpl?.pdfFile || ""));

const getTemplatePreviewCandidates = (tpl) => {
  const candidates = [];

  if (tpl?.backgroundImage) {
    candidates.push(getUploadUrl(tpl.backgroundImage));
  }

  if (tpl?.backgroundImageFileId) {
    candidates.push(getUploadUrl(`/api/files/${tpl.backgroundImageFileId}`));
  }

  if (isImageTemplate(tpl) && tpl?.pdfFile) {
    candidates.push(getUploadUrl(tpl.pdfFile));
  }

  if (tpl?.templateFileId) {
    candidates.push(getUploadUrl(`/api/files/${tpl.templateFileId}`));
  }

  if (tpl?.pdfFile) {
    candidates.push(getUploadUrl(tpl.pdfFile));
  }

  return [...new Set(candidates.filter(Boolean))];
};

const getTemplatePdfPreviewCandidates = (tpl) => {
  const candidates = [];

  if (tpl?.pdfFile) {
    candidates.push(getUploadUrl(tpl.pdfFile));
  }

  if (tpl?.templateFileId) {
    candidates.push(getUploadUrl(`/api/files/${tpl.templateFileId}`));
  }

  return [...new Set(candidates.filter(Boolean))];
};

export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === "new";

  const [template, setTemplate] = useState({
    name: "",
    description: "",
    category: "course",
    status: "draft",
    dimensions: { width: 1056, height: 816, unit: "px" },
    backgroundColor: "#ffffff",
    textFields: [],
  });
  const [activeTab, setActiveTab] = useState("design");
  const [selectedField, setSelectedField] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pdfPreviewIndex, setPdfPreviewIndex] = useState(0);
  const [pageError, setPageError] = useState(null);
  const backgroundPolicy = UPLOAD_LIMITS.backgroundImage;

  const previewCandidates = useMemo(
    () => getTemplatePreviewCandidates(template),
    [
      template.backgroundImage,
      template.pdfFile,
      template.fileType,
      template.templateMimeType,
    ],
  );

  const pdfPreviewCandidates = useMemo(
    () => getTemplatePdfPreviewCandidates(template),
    [template.pdfFile, template.templateFileId],
  );

  const activePreviewUrl = previewCandidates[previewIndex] || "";
  const activePdfPreviewUrl = pdfPreviewCandidates[pdfPreviewIndex] || "";
  const shouldShowPdfPreview =
    !activePreviewUrl && isPdfTemplate(template) && !!activePdfPreviewUrl;

  const { data: fetchedTemplate, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => api.get(`/templates/${id}`).then((r) => r.data.data),
    enabled: !isNew,
  });

  // Sync fetched data into local state when it arrives or changes
  useEffect(() => {
    if (fetchedTemplate) {
      setTemplate({
        ...fetchedTemplate,
        textFields: (fetchedTemplate.fields || []).map((f) => ({
          ...f,
          label: f.text || f.placeholder || "Field",
          color: f.fontColor || "#000000",
          bold: f.fontWeight === "bold",
          italic: f.fontStyle === "italic",
        })),
        backgroundColor: fetchedTemplate.backgroundColor || "#ffffff",
      });
    }
  }, [fetchedTemplate]);

  useEffect(() => {
    setPreviewIndex(0);
  }, [previewCandidates.join("|")]);

  useEffect(() => {
    setPdfPreviewIndex(0);
  }, [pdfPreviewCandidates.join("|")]);

  const saveMutation = useMutation({
    mutationFn: (tpl) => {
      // Map frontend textFields to backend fields format
      const fields = (tpl.textFields || []).map((f) => ({
        id: f.id,
        type: f.placeholder ? "placeholder" : "static",
        placeholder: f.placeholder || null,
        text: f.label || "",
        x: f.x,
        y: f.y,
        fontSize: f.fontSize,
        fontFamily: f.fontFamily,
        fontColor: f.color || "#000000",
        fontWeight: f.bold ? "bold" : "normal",
        fontStyle: f.italic ? "italic" : "normal",
        alignment: f.alignment || "center",
      }));

      const payload = {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        status: tpl.status,
        backgroundColor: tpl.backgroundColor,
        fields,
      };

      if (isNew) {
        // New templates require a file upload — redirect to create flow
        toast.error(
          "Please create a new template from the Templates page with a PDF/image file first.",
        );
        return Promise.reject(
          new Error("New templates must be created with a file upload"),
        );
      }
      return api.put(`/templates/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setPageError(null);
      toast.success("Template saved!");
    },
    onError: (err) => {
      // Don't double-toast if we already showed the "create from templates page" message
      if (err.message?.includes("file upload")) return;
      const errorInfo = getApiErrorInfo(err, "Failed to save template");
      setPageError(errorInfo);
      toast.error(errorInfo.userMessage);
    },
  });

  // Dedicated mutation to toggle status (activate / set draft)
  const statusMutation = useMutation({
    mutationFn: (newStatus) =>
      api.put(`/templates/${id}`, { status: newStatus }),
    onSuccess: (res) => {
      const updated = res.data.data;
      setTemplate((prev) => ({ ...prev, status: updated.status }));
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setPageError(null);
      toast.success(
        updated.status === "active"
          ? "Template activated!"
          : "Template set to draft",
      );
    },
    onError: (err) => {
      const errorInfo = getApiErrorInfo(err, "Failed to update status");
      setPageError(errorInfo);
      toast.error(errorInfo.userMessage);
    },
  });

  const uploadBgMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/templates/${id}/upload-background`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: ({ data }) => {
      setTemplate((prev) => ({ ...prev, backgroundImage: data.data?.url }));
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      setPageError(null);
      toast.success("Background uploaded!");
    },
    onError: (err) => {
      const errorInfo = getApiErrorInfo(err, "Failed to upload background");
      setPageError(errorInfo);
      toast.error(errorInfo.userMessage);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles[0]) return;

      if (isNew) {
        toast.error("Save the template first before uploading a background");
        return;
      }

      const validation = validateUploadFile(acceptedFiles[0], backgroundPolicy);
      if (!validation.ok) {
        toast.error(`${validation.reason} ${validation.nextStep}`);
        return;
      }

      uploadBgMutation.mutate(acceptedFiles[0]);
    },
    [backgroundPolicy, isNew],
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
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: backgroundPolicy.maxSizeMb * 1024 * 1024,
  });

  const addTextField = () => {
    const newField = {
      id: Date.now().toString(),
      label: "New Field",
      placeholder: "{{name}}",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "Helvetica",
      color: "#000000",
      alignment: "center",
      bold: false,
      italic: false,
    };
    setTemplate((prev) => ({
      ...prev,
      textFields: [...(prev.textFields || []), newField],
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    setTemplate((prev) => ({
      ...prev,
      textFields: prev.textFields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    }));
  };

  const removeField = (fieldId) => {
    setTemplate((prev) => ({
      ...prev,
      textFields: prev.textFields.filter((f) => f.id !== fieldId),
    }));
    setSelectedField(null);
  };

  if (!isNew && isLoading) return <PageLoader />;

  const selectedFieldData = template.textFields?.find(
    (f) => f.id === selectedField,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/templates")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-display">
              {isNew ? "Create Template" : "Edit Template"}
            </h1>
            <p className="text-sm text-gray-500">
              Design your certificate layout
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            loading={statusMutation.isPending}
            loadingText="Updating..."
            disabled={isNew}
            onClick={() => {
              const newStatus =
                template.status === "active" ? "draft" : "active";
              statusMutation.mutate(newStatus);
            }}
          >
            {template.status === "active" ? "Set Draft" : "Activate"}
          </Button>
          <Button
            onClick={() => saveMutation.mutate(template)}
            loading={saveMutation.isPending}
            loadingText="Saving..."
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert
          type="error"
          title={pageError.whatFailed}
          reason={pageError.reason}
          nextStep={pageError.nextStep}
          details={pageError.details}
          technicalDetails={pageError.technicalMessage}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel — Properties */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Properties
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={template.name}
                onChange={(e) =>
                  setTemplate({ ...template, name: e.target.value })
                }
                placeholder="Template name"
              />
              <Input
                label="Description"
                value={template.description || ""}
                onChange={(e) =>
                  setTemplate({ ...template, description: e.target.value })
                }
                placeholder="Description..."
              />
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={template.category}
                  onChange={(e) =>
                    setTemplate({ ...template, category: e.target.value })
                  }
                >
                  <option value="course">Course</option>
                  <option value="achievement">Achievement</option>
                  <option value="participation">Participation</option>
                  <option value="award">Award</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={template.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        backgroundColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text fields list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Text Fields
                </h3>
                <button
                  onClick={addTextField}
                  className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {(template.textFields || []).map((field) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field.id)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${
                    selectedField === field.id
                      ? "bg-primary-50 border-l-2 border-l-primary-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {field.label}
                    </p>
                    <p className="text-xs text-gray-400">{field.placeholder}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(field.id);
                    }}
                    className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!template.textFields || template.textFields.length === 0) && (
                <p className="px-4 py-4 text-sm text-gray-400 text-center">
                  No text fields. Click + to add.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Center — Canvas preview */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Canvas Preview
              </h3>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`relative aspect-[4/3] rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
                  isDragActive
                    ? "border-primary-400 bg-primary-50"
                    : "border-gray-200 bg-gray-50"
                }`}
                style={{ backgroundColor: template.backgroundColor }}
              >
                <input {...getInputProps()} />
                {activePreviewUrl ? (
                  <img
                    src={activePreviewUrl}
                    alt="Background"
                    className="w-full h-full object-contain"
                    onError={() => {
                      setPreviewIndex((current) => {
                        if (current < previewCandidates.length - 1) {
                          return current + 1;
                        }
                        return previewCandidates.length;
                      });
                    }}
                  />
                ) : shouldShowPdfPreview ? (
                  <object
                    data={activePdfPreviewUrl}
                    type="application/pdf"
                    className="w-full h-full"
                    aria-label="Template PDF preview"
                  >
                    <iframe
                      title="Template PDF preview"
                      src={activePdfPreviewUrl}
                      className="w-full h-full border-0"
                      onError={() => {
                        setPdfPreviewIndex((current) => {
                          if (current < pdfPreviewCandidates.length - 1) {
                            return current + 1;
                          }
                          return pdfPreviewCandidates.length;
                        });
                      }}
                    />
                  </object>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Upload className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">
                      Drop a background image here
                    </p>
                    <p className="text-xs mt-1">
                      {getUploadLimitText(backgroundPolicy)}
                    </p>
                  </div>
                )}

                {/* Render text fields on canvas */}
                {(template.textFields || []).map((field) => (
                  <div
                    key={field.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedField(field.id);
                    }}
                    className={`absolute cursor-move border border-transparent hover:border-primary-400 rounded px-2 py-1 transition-colors ${
                      selectedField === field.id
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : ""
                    }`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${Math.max(field.fontSize * 0.5, 10)}px`,
                      fontFamily: field.fontFamily,
                      color: field.color,
                      fontWeight: field.bold ? "bold" : "normal",
                      fontStyle: field.italic ? "italic" : "normal",
                      textAlign: field.alignment,
                    }}
                  >
                    {field.placeholder || field.label}
                  </div>
                ))}

                {uploadBgMutation.isPending && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                    <InlineLoader label="Uploading background..." />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — Field properties */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Field Properties</h3>
            </CardHeader>
            <CardContent>
              {selectedFieldData ? (
                <div className="space-y-4">
                  <Input
                    label="Label"
                    value={selectedFieldData.label}
                    onChange={(e) =>
                      updateField(selectedField, { label: e.target.value })
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder
                    </label>
                    <select
                      value={selectedFieldData.placeholder || ""}
                      onChange={(e) =>
                        updateField(selectedField, {
                          placeholder: e.target.value || null,
                        })
                      }
                      className="input w-full"
                    >
                      <option value="">None (Static Text)</option>
                      <option value="{{name}}">Recipient Name</option>
                      <option value="{{email}}">Recipient Email</option>
                      <option value="{{date}}">Date</option>
                      <option value="{{event}}">Event Name</option>
                      <option value="{{certificateId}}">Certificate ID</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="X Position (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={selectedFieldData.x}
                      onChange={(e) =>
                        updateField(selectedField, {
                          x: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      label="Y Position (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={selectedFieldData.y}
                      onChange={(e) =>
                        updateField(selectedField, {
                          y: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Font Size"
                    type="number"
                    min="8"
                    max="120"
                    value={selectedFieldData.fontSize}
                    onChange={(e) =>
                      updateField(selectedField, {
                        fontSize: Number(e.target.value),
                      })
                    }
                  />
                  <div>
                    <label className="label">Font Family</label>
                    <select
                      className="input"
                      value={selectedFieldData.fontFamily}
                      onChange={(e) =>
                        updateField(selectedField, {
                          fontFamily: e.target.value,
                        })
                      }
                    >
                      <option>Helvetica</option>
                      <option>Times-Roman</option>
                      <option>Courier</option>
                      <option>Georgia</option>
                      <option>Arial</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedFieldData.color}
                        onChange={(e) =>
                          updateField(selectedField, { color: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={selectedFieldData.color}
                        onChange={(e) =>
                          updateField(selectedField, { color: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Alignment</label>
                    <div className="flex gap-1">
                      {["left", "center", "right"].map((a) => (
                        <button
                          key={a}
                          onClick={() =>
                            updateField(selectedField, { alignment: a })
                          }
                          className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                            selectedFieldData.alignment === a
                              ? "bg-primary-100 text-primary-700"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateField(selectedField, {
                          bold: !selectedFieldData.bold,
                        })
                      }
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                        selectedFieldData.bold
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() =>
                        updateField(selectedField, {
                          italic: !selectedFieldData.italic,
                        })
                      }
                      className={`flex-1 py-2 rounded-lg text-sm font-medium italic transition-colors ${
                        selectedFieldData.italic
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  Select a text field to edit its properties
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
