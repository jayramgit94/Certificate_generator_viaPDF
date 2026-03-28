import { ArrowLeft, Award, CheckCircle, Search, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import api, { getApiErrorInfo } from "../../lib/api";
import { formatDate } from "../../lib/utils";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setErrorInfo(null);
    setResult(null);
    try {
      const { data } = await api.get(`/certificates/verify/${certId.trim()}`);
      setResult(data.data);
    } catch (err) {
      setErrorInfo(
        getApiErrorInfo(err, "Certificate not found or invalid"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-display text-gray-900">
            CertifyPro
          </span>
          <span className="text-sm text-gray-400 ml-1">
            Certificate Verification
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="ml-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            Verify Certificate
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Enter a certificate ID to verify its authenticity and view details.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleVerify} className="flex gap-3">
              <Input
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="Enter Certificate ID (e.g., CERT-2024-XXXXXXXX)"
                className="flex-1"
              />
              <Button type="submit" loading={loading} loadingText="Verifying...">
                <Search className="w-4 h-4" />
                Verify
              </Button>
            </form>
          </CardContent>
        </Card>

        {errorInfo && (
          <Alert
            type="error"
            title={errorInfo.whatFailed || "Verification failed"}
            reason={errorInfo.reason}
            nextStep={errorInfo.nextStep}
            details={errorInfo.details}
            technicalDetails={errorInfo.technicalMessage}
          />
        )}

        {result && (
          <Card className="border-success-200 overflow-hidden animate-slide-up">
            <div className="bg-success-50 px-6 py-4 flex items-center gap-4 border-b border-success-200">
              <CheckCircle className="w-10 h-10 text-success-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-success-800">
                  {result.valid
                    ? "Certificate Verified"
                    : "Certificate Revoked"}
                </h3>
                <p className="text-sm text-success-600">
                  {result.valid
                    ? "This certificate is authentic and valid."
                    : `This certificate has been revoked${result.certificate?.revokedReason ? `: ${result.certificate.revokedReason}` : "."}`}
                </p>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              {[
                {
                  label: "Certificate ID",
                  value: result.certificate?.certificateId,
                },
                {
                  label: "Recipient Name",
                  value: result.certificate?.recipientName,
                },
                {
                  label: "Event",
                  value: result.certificate?.eventName,
                },
                {
                  label: "Issued On",
                  value: formatDate(result.certificate?.issueDate),
                },
                {
                  label: "Status",
                  value: result.valid ? "Valid" : "Revoked",
                },
              ].map(
                (item) =>
                  item.value && (
                    <div
                      key={item.label}
                      className="flex justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-500">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value}
                      </span>
                    </div>
                  ),
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
