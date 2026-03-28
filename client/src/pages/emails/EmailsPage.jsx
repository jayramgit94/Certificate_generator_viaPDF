import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Mail,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import Spinner, { PageLoader } from "../../components/ui/Spinner";
import api, { getApiErrorInfo } from "../../lib/api";
import { formatDate, formatNumber } from "../../lib/utils";

export default function EmailsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sendModal, setSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    templateId: "",
    recipientBatchId: "",
    emailTemplateId: "",
    subject: "Your Certificate is Ready!",
  });
  const [pageError, setPageError] = useState(null);
  const [retryTargetId, setRetryTargetId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-logs", page, search, statusFilter],
    queryFn: () =>
      api
        .get("/emails/logs", {
          params: {
            page,
            limit: 15,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data.data),
  });

  const { data: emailTemplates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => api.get("/emails/templates").then((r) => r.data.data || []),
  });

  const { data: certBatches = [] } = useQuery({
    queryKey: ["batches-for-email"],
    queryFn: () =>
      api
        .get("/recipients", { params: { limit: 100 } })
        .then((r) => {
          const payload = r.data?.data;
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.batches)) return payload.batches;
          if (Array.isArray(payload?.items)) return payload.items;
          return [];
        }),
  });

  const recipientBatchOptions = useMemo(
    () =>
      (certBatches || [])
        .map((batch) => {
          const id = batch?._id || batch?.id || "";
          if (!id) return null;

          const displayName =
            batch.batchName ||
            batch.sourceFile ||
            batch.originalFileName ||
            "Untitled batch";

          return {
            label: `${displayName} (${batch?.summary?.valid || 0})`,
            value: id,
          };
        })
        .filter(Boolean),
    [certBatches],
  );

  const sendMutation = useMutation({
    mutationFn: (data) => api.post("/emails/send-by-batch", data),
    onMutate: () => {
      setPageError(null);
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      setSendModal(false);
      setPageError(null);
      toast.success(data.message || `Batch email initiated!`);
    },
    onError: (err) => {
      const errorInfo = getApiErrorInfo(err, "Failed to send emails");
      setPageError(errorInfo);
      toast.error(errorInfo.userMessage);
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id) => api.post("/emails/retry", { emailLogIds: [id] }),
    onMutate: (id) => {
      setRetryTargetId(id);
      setPageError(null);
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      setPageError(null);
      toast.success(data.message || "Email retry initiated");
    },
    onError: (err) => {
      const errorInfo = getApiErrorInfo(err, "Failed to retry email");
      setPageError(errorInfo);
      toast.error(errorInfo.userMessage);
    },
    onSettled: () => {
      setRetryTargetId(null);
    },
  });

  if (isLoading) return <PageLoader />;

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  const statusIcon = (status) => {
    switch (status) {
      case "delivered":
      case "sent":
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case "failed":
      case "bounced":
        return <XCircle className="w-4 h-4 text-danger-500" />;
      default:
        return <Clock className="w-4 h-4 text-warning-500" />;
    }
  };

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
            Email Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Send certificates and track delivery
          </p>
        </div>
        <Button onClick={() => setSendModal(true)}>
          <Send className="w-4 h-4" />
          Send Batch Emails
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sent",
            value: data?.stats?.total || 0,
            color: "text-gray-900",
          },
          {
            label: "Delivered",
            value: data?.stats?.delivered || 0,
            color: "text-success-600",
          },
          {
            label: "Failed",
            value: data?.stats?.failed || 0,
            color: "text-danger-600",
          },
          {
            label: "Pending",
            value: data?.stats?.pending || 0,
            color: "text-warning-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>
                {formatNumber(s.value)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
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
            { label: "All", value: "" },
            { label: "Sent", value: "sent" },
            { label: "Delivered", value: "delivered" },
            { label: "Failed", value: "failed" },
            { label: "Pending", value: "pending" },
          ]}
          className="w-full sm:w-36"
        />
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

      {/* Logs table */}
      {logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails sent yet"
          description="Send batch emails with certificates to your recipients."
          action={
            <Button onClick={() => setSendModal(true)}>
              <Send className="w-4 h-4" />
              Send Emails
            </Button>
          }
        />
      ) : (
        <>
          <Card className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {statusIcon(log.status)}
                          <Badge
                            variant={
                              log.status === "delivered" ||
                              log.status === "sent"
                                ? "success"
                                : log.status === "failed"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {log.recipientName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {log.recipientEmail}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">
                        {log.attempt || 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(log.sentAt || log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {(log.status === "failed" ||
                          log.status === "bounced") && (
                          <button
                            onClick={() => retryMutation.mutate(log._id)}
                            disabled={retryTargetId === log._id}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            title="Retry"
                          >
                            {retryTargetId === log._id ? (
                              <Spinner size="sm" className="text-primary-600" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {logs.map((log) => (
              <Card key={log._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.recipientName}</p>
                    <p className="text-xs text-gray-400 truncate">{log.recipientEmail}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {statusIcon(log.status)}
                    <Badge variant={log.status === "delivered" || log.status === "sent" ? "success" : log.status === "failed" ? "danger" : "warning"}>{log.status}</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">{log.subject}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(log.sentAt || log.createdAt)}</span>
                  {(log.status === "failed" || log.status === "bounced") && (
                    <button
                      onClick={() => retryMutation.mutate(log._id)}
                      disabled={retryTargetId === log._id}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                      {retryTargetId === log._id ? (
                        <Spinner size="sm" className="text-primary-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {retryTargetId === log._id ? "Retrying..." : "Retry"}
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

      {/* Send Modal */}
      <Modal
        isOpen={sendModal}
        onClose={() => setSendModal(false)}
        title="Send Batch Emails"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMutation.mutate(sendForm);
          }}
          className="space-y-5"
        >
          <Input
            label="Subject"
            value={sendForm.subject}
            onChange={(e) =>
              setSendForm({ ...sendForm, subject: e.target.value })
            }
            placeholder="Email subject line..."
          />
          <Select
            label="Recipient Batch"
            value={sendForm.recipientBatchId}
            onChange={(v) => setSendForm({ ...sendForm, recipientBatchId: v })}
            options={recipientBatchOptions}
            placeholder="Select batch..."
          />
          <Select
            label="Email Template (Optional)"
            value={sendForm.emailTemplateId}
            onChange={(v) => setSendForm({ ...sendForm, emailTemplateId: v })}
            options={[
              { label: "Default Template", value: "" },
              ...(emailTemplates || []).map((t) => ({
                label: t.name,
                value: t._id,
              })),
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setSendModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={sendMutation.isPending}
              loadingText="Sending emails..."
            >
              <Send className="w-4 h-4" />
              Send Emails
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
