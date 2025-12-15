import { ChangeEvent, DragEvent, useRef, useState } from "react";

interface Props {
  onParse: (content: string) => void;
}

export default function UploadPanel({ onParse }: Props) {
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.toString() ?? "");
      reader.onerror = () => reject(new Error(`无法读取文件：${file.name}`));
      reader.readAsText(file);
    });

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).sort((a, b) => a.name.localeCompare(b.name));
    try {
      const contents = await Promise.all(files.map(readFile));
      const merged = contents.join("\n");
      setFileLabel(files.length === 1 ? files[0].name : `${files.length} 个文件：${files[0].name}...`);
      onParse(merged);
    } catch (err) {
      setFileLabel("文件读取失败，请重试");
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <section className="card upload">
      <div className="card-head">
        <div>
          <p className="eyebrow">上传或拖拽日志</p>
          <h2>加载 GC 日志</h2>
          <p className="sub">支持常见的 G1、Parallel、CMS、ZGC 文本日志，包含滚动文件（log.0、log.1）。</p>
        </div>
      </div>
      <label
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".log,.log.*,*.log,*.log.*,*.txt"
          multiple
          onChange={onChange}
          hidden
        />
        <p>{fileLabel ? fileLabel : "拖拽日志到这里，或点击选择文件"}</p>
        <button
          type="button"
          className="primary"
          onClick={() => inputRef.current?.click()}
        >
          选择文件
        </button>
      </label>
    </section>
  );
}
