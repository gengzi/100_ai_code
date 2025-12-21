import SectionCard from "../../components/SectionCard";

interface ExportPanelProps {
  onExport: () => void;
  onImport: (file: File) => void;
}

const ExportPanel = ({ onExport, onImport }: ExportPanelProps) => {
  return (
    <SectionCard title="导入 / 导出" badge="JSON">
      <div className="stack">
        <button className="button" type="button" onClick={onExport}>
          导出为 JSON
        </button>
        <label className="button ghost" style={{ textAlign: "center" }}>
          导入 JSON
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImport(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </SectionCard>
  );
};

export default ExportPanel;
