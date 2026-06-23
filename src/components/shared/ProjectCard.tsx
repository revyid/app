import { Calendar, User, Tag, LayoutDashboard, Wallet, Code2, ArrowUpRight, Terminal, Globe } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Wallet, Code2, Terminal, Globe,
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const IconComponent = iconMap[project.icon] || LayoutDashboard;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer block focus-ring rounded-[24px] transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.97] active:translate-y-0"
    >
      <div className="relative card-filled overflow-hidden p-0 rounded-[24px]">
        <div className="absolute inset-0 state-layer pointer-events-none rounded-[inherit]" />
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]" />

        {/* Image Area */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary/10">
          <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
            {project.thumbnail && (
              <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {project.href ? (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-2 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 hover:bg-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="w-5 h-5 text-foreground" />
            </a>
          ) : (
            <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-2 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
              <ArrowUpRight className="w-5 h-5 text-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-elevation-1 bg-primary rounded-[12px] transition-all duration-300 group-hover:rotate-2 group-hover:rounded-[16px]">
              <IconComponent className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <Calendar className="w-3.5 h-3.5" />{project.date}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <User className="w-3.5 h-3.5" />{project.role}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <Tag className="w-3.5 h-3.5" />{project.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 origin-left bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
      </div>
    </div>
  );
}
