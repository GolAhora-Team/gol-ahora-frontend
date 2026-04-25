import React from 'react';
import { ChevronRight } from 'lucide-react';

const ModuleCard = ({ module }) => {
  const { icon: Icon, title, desc, color, iconCol } = module;
  return (
    <div className="group relative bg-white/95 p-8 rounded-[2.5rem] shadow-xl border-l-[6px] border-[#ffb300] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer flex items-center gap-6 h-40 overflow-hidden">
      <div className={`p-5 rounded-3xl ${color} bg-opacity-10 transition-all group-hover:bg-opacity-20 flex-shrink-0`}>
        <Icon size={36} className={iconCol} />
      </div>
      <div className="flex flex-col z-10 flex-1">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{title}</h3>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-[#ffb300] group-hover:translate-x-1 transition-all" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mt-1">{desc}</p>
      </div>
    </div>
  );
};

export default ModuleCard;