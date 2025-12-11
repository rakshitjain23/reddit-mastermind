"use client";

import { MessageSquare, Calendar, ArrowBigUp, Share2, MoreHorizontal, Download } from "lucide-react";
import { Comment, CalendarData } from "@/lib/types";
import * as XLSX from "xlsx";

interface ContentCalendarProps {
  data: CalendarData;
}

function CommentThread({ comment, depth = 0 }: { comment: Comment, depth?: number }) {
  if (!comment) return null;
  
  return (
    <div className={`flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${depth > 0 ? "mt-3 pl-3 border-l-2 border-zinc-700/50" : ""}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] uppercase font-bold text-white">
          {comment.persona.slice(0, 2)}
        </div>
        <span className="text-xs font-bold text-zinc-400">
          u/{comment.persona.replace(/\s+/g, '')}
        </span>
        <span className="text-[10px] text-zinc-600">
          • {comment.timestamp ? new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Now"}
        </span>
      </div>
      
      <div className="ml-2">
        <p className="text-sm text-zinc-300 leading-relaxed">
          {comment.text}
        </p>
        
        <div className="flex items-center gap-4 mt-2 mb-2">
           <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
              <ArrowBigUp size={14} /> Vote
           </button>
           <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
              <MessageSquare size={12} /> Reply
           </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-3">
             {comment.replies.map((reply, idx) => (
               <CommentThread key={idx} comment={reply} depth={depth + 1} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContentCalendar({ data }: ContentCalendarProps) {
  if (!data || !data.posts) return null;

  const handleExportXLSX = () => {
    // 1. Prepare Posts Data
    const postsSheetData = data.posts.map((post) => ({
      post_id: post.id || "gen_id_" + Math.random().toString(36).substr(2, 9),
      subreddit: post.subreddit,
      title: post.title,
      body: post.body,
      author_username: post.persona,
      timestamp: post.timestamp || new Date().toISOString(),
      keywords_ids: post.topic
    }));

    // 2. Prepare Comments Data
    const commentsSheetData = data.posts.flatMap((post) => {
      const postId = post.id || "unknown_id"; 
      const comments = Array.isArray(post.comments) ? post.comments : [];
      
      return comments.map((comment) => ({
        post_id: postId,
        comment_text: comment.text,
        username: comment.persona,
        timestamp: comment.timestamp || new Date().toISOString()
      }));
    });

    // 3. Create Workbook & Sheet
    const workbook = XLSX.utils.book_new();
    
    // Create sheet with Posts first
    const worksheet = XLSX.utils.json_to_sheet(postsSheetData);

    // 4. Append Comments Tables (Shifted down)
    // Offset = Header (1) + Data Length + Gap (3)
    const offset = postsSheetData.length + 4;
    
    // Add a Section Header for Comments
    XLSX.utils.sheet_add_aoa(worksheet, [["COMMENTS SECTION"]], { origin: `A${offset - 1}` });
    
    // Add the Comments Data
    XLSX.utils.sheet_add_json(worksheet, commentsSheetData, { origin: `A${offset}` });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Content Master");
    XLSX.writeFile(workbook, `reddit-content-${data.week_start}.xlsx`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header and Controls */}
      <div className="flex flex-col gap-6 border-b border-zinc-800 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-full text-white">
                <Calendar className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-zinc-100">Content Schedule</h2>
                <p className="text-sm text-zinc-500">Week of {data.week_start}</p>
             </div>
          </div>
          <button 
            onClick={handleExportXLSX}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-colors"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {data.posts.map((post, idx) => {
          const commentsArray = Array.isArray(post.comments) ? post.comments : [];
          // Deterministic fake points
          const voteCount = post.title.length * 2 + (commentsArray.length * 5) + 12;

          return (
            <article
              key={idx}
              className="flex bg-[#1a1a1b] rounded-md border border-zinc-800 hover:border-zinc-600 transition-colors overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {/* Vote Sidebar */}
              <div className="w-10 bg-[#151516] flex flex-col items-center py-3 gap-1 border-r border-zinc-900/50">
                <ArrowBigUp className="w-6 h-6 text-zinc-500 hover:text-orange-500 cursor-pointer transition-colors" />
                <span className="text-xs font-bold text-zinc-100">{voteCount}</span>
                <ArrowBigUp className="w-6 h-6 rotate-180 text-zinc-500 hover:text-blue-500 cursor-pointer transition-colors" />
              </div>

              {/* Content Area */}
              <div className="flex-1 p-3 pt-2">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <span className="font-bold text-zinc-200 hover:underline cursor-pointer">r/{post.subreddit}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span>Posted by <span className="hover:underline cursor-pointer">u/{post.persona}</span></span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span>{post.timestamp ? new Date(post.timestamp).toLocaleDateString() : "Just now"}</span>
                </div>

                {/* Title & Body */}
                <h3 className="text-lg font-medium text-zinc-100 mb-2 leading-snug">{post.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4 whitespace-pre-wrap font-light">
                    {post.body}
                </p>

                {/* Footer Actions */}
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800 rounded-sm cursor-pointer transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>{commentsArray.length} Comments</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800 rounded-sm cursor-pointer transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800 rounded-sm cursor-pointer transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                    <span>Save</span>
                  </div>
                </div>

                {/* Comments Section */}
                {commentsArray.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4 bg-[#1a1a1b]/50">
                    {commentsArray.map((comment: Comment, cIdx: number) => (
                      <CommentThread key={cIdx} comment={comment} />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
