import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const SectionCard = ({ title, badge, actions, children }: SectionCardProps) => {
  return (
    <section className="section-card">
      <div className="section-header">
        <div className="row" style={{ gap: "10px" }}>
          <span className="section-title">{title}</span>
          {badge ? <span className="badge">{badge}</span> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
};

export default SectionCard;
