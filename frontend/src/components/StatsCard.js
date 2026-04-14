import React from "react";
import "../App.css";

const StatsCard = ({ title, value, icon, trend, color }) => {
  return (
    <div className="glass-card stats-card">
      <div className="stats-icon" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
      <div className="stats-info">
        <span className="stats-label">{title}</span>
        <h2 className="stats-value">{value}</h2>
        {trend && (
          <span className={`stats-trend ${trend.startsWith('+') ? 'up' : 'down'}`}>
            {trend} from last hour
          </span>
        )}
      </div>
      <div className="stats-glow" style={{ backgroundColor: color }}></div>
    </div>
  );
};

export default StatsCard;
