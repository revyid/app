import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Github, Calendar, User, Tag, CheckCircle2, Clock, Archive } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Project } from '@/types';
import { IconButton } from '@/components/ui/button';
import { modalBackdrop } from '@/lib/motion-presets';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with animated blobs */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-tertiary/15 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, 80, 0], scale: [1, 0.8, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 right-1/3 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[36px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-surface/95 dark:bg-surface/95 backdrop-blur-[40px]" />

            <div className="relative flex flex-col max-h-[90vh]">
              {/* Thumbnail header */}
              <div className="relative h-52 flex-shrink-0 overflow-hidden">
                {project.thumbnail && (
                  <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: project.color }} />

                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm hover:bg-surface"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </IconButton>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-bold text-foreground">{project.title}</h2>
                    {project.status && (() => {
                      const s = statusConfig[project.status] ?? statusConfig.live;
                      const Icon = s.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${s.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                      <Calendar className="w-3.5 h-3.5" />{project.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                      <User className="w-3.5 h-3.5" />{project.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-lg border border-outline/10">
                      <Tag className="w-3.5 h-3.5" />{project.category}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">About</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground
                      prose-headings:text-foreground prose-headings:font-semibold
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-code:bg-surface-variant prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-surface-variant prose-pre:rounded-xl prose-pre:border prose-pre:border-outline/10
                      prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                      prose-li:marker:text-primary">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {project.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {project.techStack && project.techStack.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="px-3 py-1 text-xs font-medium rounded-full border border-outline/20 bg-surface-variant text-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.features && project.features.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Features</h3>
                    <ul className="space-y-1.5">
                      {project.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {project.href && (
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      View Project
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      Source Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
