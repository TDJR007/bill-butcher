import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FileUpload from "../components/FileUpload";
import { Sparkles, FileText } from "lucide-react"

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      console.log("Please select a file first!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {

        console.log("Uploaded successfully!");
        localStorage.setItem("file_id", data.file_id);
        navigate("/chat", { state: { file_id: data.file_id } });

      } else {
        console.log("Upload failed. Try again.");
      }
    } catch (err) {
      console.log("Error uploading file.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">

          <h1 className="text-gray-300 text-lg bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/30 drop-shadow-lg inline-block">
            Upload your bill and let Billy tear it apart for you
          </h1>
        </div>

        {/* File Upload */}
        <FileUpload onFileSelect={setFile} />

        {/* Selected File Display */}
        {file && (
          <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-grey-400" />
              <span className="text-white font-medium">Selected:</span>
              <span className="text-gray-300">{file.name}</span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className={`group relative inline-flex items-center gap-3 px-6 py-2 border-2 rounded-lg text-lg font-bold uppercase transition-all duration-300 transform ${isUploading || !file
                ? "opacity-50 cursor-not-allowed bg-gray-800 border-gray-600 text-gray-400"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-500 text-white hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 active:scale-95"
              }`}
          >
            <Sparkles className={`w-6 h-6 ${isUploading || !file ? "text-gray-400" : "text-yellow-400 group-hover:animate-pulse"}`} />
            {isUploading ? "UPLOADING..." : "SUBMIT AND CHAT WITH BILLY"}
          </button>
        </div>

        {/* Additional Info */}

        <div className="flex justify-center">
          <div className="text-center text-gray-400 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/30 w-fit">
            Only PDF files are supported at the moment
          </div>
        </div>

      </div>
    </div>
  );
}

export default UploadPage;