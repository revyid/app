import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Github, Calendar, User, Tag, CheckCircle2, Clock, Archive } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Project } from '@/types';
import { IconButton } from '@/components/ui/button';
import { modalBackdrop, bottomSheetContent } from '@/lib/motion-presets';

interface ProjectDetailProps {
  project: Project | null;
  onClose: () => void;
}

const statusConfig = {
  live: { label: 'Live', icon: CheckCircle2, className: 'text-green-500 bg-green-500/10' },
  wip: { label: 'In Progress', icon: Clock, className: 'text-yellow-500 bg-yellow-500/10' },
  archived: { label: 'Archived', icon: Archive, className: 'text-muted-foreground bg-muted' },
};

export function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Corner floating panel — same as ChatPopup */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[460px] sm:max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="bg-surface dark:bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 border border-outline/20 overflow-hidden noise-grain max-h-[85vh] flex flex-col">
              {/* Drag handle */}
              <div className="pt-3 pb-0 flex-shrink-0">
                <div className="sheet-handle" />
              </div>

              {/* Thumbnail header */}
              {project.thumbnail ? (
                <div className="relative h-40 flex-shrink-0 overflow-hidden">
                  <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: project.color }} />
                  <div className="absolute top-3 right-3">
                    <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="Close"
                      className="bg-surface/80 backdrop-blur-sm hover:bg-surface rounded-full">
                      <X className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              ) : (
                /* Header row when no thumbnail */
                <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: project.color + '33' }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{project.title}</h3>
                      <p className="text-xs text-muted-foreground">{project.category}</p>
                    </div>
                  </div>
                  <IconButton onClick={onClose} variant="ghost" className="rounded-full bg-surface-variant hover:bg-surface-variant/80">
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-foreground">{project.title}</h2>
                  {project.status && (() => {
                    const s = statusConfig[project.status] ?? statusConfig.live;
                    const Icon = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${s.className}`}>
                        <Icon className="w-3.5 h-3.5" />{s.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 h-6 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                    <Calendar className="w-3 h-3" />{project.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                    <User className="w-3 h-3" />{project.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                    <Tag className="w-3 h-3" />{project.category}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground
                    prose-headings:text-foreground prose-headings:font-semibold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-surface-variant prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-surface-variant prose-pre:rounded-xl prose-pre:border prose-pre:border-outline/10
                    prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                    prose-li:marker:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                  </div>
                )}

                {/* Tech stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Tech Stack</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="px-2.5 py-1 text-xs font-medium rounded-full border border-outline/20 bg-surface-variant text-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {project.features && project.features.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Features</h3>
                    <ul className="space-y-1">
                      {project.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer CTA — always visible */}
              {(project.href || project.repoUrl) && (
                <div className="flex gap-2 p-4 border-t border-outline/20 flex-shrink-0">
                  {project.href && (
                    <a href={project.href} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                      <ArrowUpRight className="w-4 h-4" />View Project
                    </a>
                  )}
                  {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors">
                      <Github className="w-4 h-4" />Source Code
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
