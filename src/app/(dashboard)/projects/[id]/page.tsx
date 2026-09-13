"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGetProjectDetailsQuery } from "@/features/projects/projectsApi";
import { Loader2, ArrowLeft, Github, Globe, Calendar, User, BookOpen, Layout, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { projectImageLoader } from "@/lib/projectImage";

/**
 * Project Details Page (Student/Admin View)
 */
export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading, isError } = useGetProjectDetailsQuery(projectId);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-100";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading project details...</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-bold text-red-900 mb-2">Project not found</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Project Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Project Cover/Thumbnail */}
            <div className="relative aspect-video bg-background flex items-center justify-center border-b border-border overflow-hidden">
              {project.thumbnailUrl ? (
                <Image
                  loader={projectImageLoader}
                  unoptimized
                  src={project.thumbnailUrl}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              ) : (
                <Layout className="h-24 w-24 text-muted-foreground" />
              )}
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2",
                  getStatusStyles(project.status)
                )}>
                  {project.status}
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">{project.title}</h2>
              </div>

              <div className="prose prose-blue max-w-none">
                <p className="text-foreground text-lg leading-relaxed">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="pt-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span key={index} className="px-4 py-2 bg-background text-foreground text-sm font-semibold rounded-xl border border-border">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Feedback */}
          {project.adminFeedback && (
            <div className="bg-primary/10/50 rounded-3xl border border-primary/20 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-primary">Instructor Feedback</h3>
              </div>
              <p className="text-blue-800 leading-relaxed italic">
                &ldquo;{project.adminFeedback}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Links</h4>
              <div className="space-y-3">
                {project.githubUrl && (
                  <Button asChild className="w-full justify-start h-12 bg-gray-900 hover:bg-black text-white rounded-xl">
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-3 h-5 w-5" />
                      View Repository
                    </a>
                  </Button>
                )}
                {project.demoUrl && (
                  <Button asChild variant="outline" className="w-full justify-start h-12 rounded-xl border-border">
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-3 h-5 w-5 text-primary" />
                      Live Demo
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Metadata</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Course</p>
                    <p className="truncate text-sm font-bold text-foreground" title={project.course?.title}>
                      {project.course?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Submitted On</p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {format(new Date(project.createdAt), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Student</p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {project.user?.firstName} {project.user?.lastName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {project.status === "PENDING" && (
               <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10 mt-4">
                  <Link href={`/projects/edit/${project.id}`}>Edit Submission</Link>
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
