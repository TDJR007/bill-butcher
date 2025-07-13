import { Upload } from "lucide-react";

function FileUpload({ onFileSelect }) {
  return (
    <div className="m-4 max-w-xs mx-auto">
      <label
        htmlFor="File"
        className="block rounded-xl border-2 border-dashed border-gray-600 hover:border-red-500 p-6 bg-black/40 backdrop-blur-sm shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-red-500/20 hover:bg-black/60 group"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-gray-500/50 shadow-lg group-hover:from-red-600 group-hover:to-red-800 group-hover:border-red-500/50 transition-all duration-300">
            <Upload className="w-6 h-6 text-white" />
          </div>
          
          <div className="text-center">
            <span className="block text-lg font-bold text-white mb-1">
              Upload your file
            </span>
            <span className="text-gray-400 text-xs">
              Drop your PDF here or click to browse
            </span>
          </div>
        </div>

        <input
          type="file"
          id="File"
          className="sr-only"
          accept="application/pdf"
          onChange={(e) => onFileSelect(e.target.files[0])}
        />
      </label>
    </div>
  );
}

export default FileUpload;