import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, Edit2, Trash2, Reply, Shield, 
  Download, File, FileText, FileVideo, FileAudio, FileArchive, Image
} from 'lucide-react';

interface MessageBubbleProps {
  id: string;
  content: string;
  imageUrl?: string;
  fileName?: string;
  fileType?: string;
  senderName: string;
  senderAvatar?: string;
  senderId: string;
  currentUserId?: string;
  createdAt: string;
  editedAt?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  userRole?: string;
  isGrouped?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  isAdmin?: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (message: any) => void;
  onModerate?: (userId: string, userName: string) => void;
  onViewProfile?: (userId: string, userName: string) => void;
  onDismiss?: (id: string) => void;
}

// Role badge styles
const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, string> = {
    owner: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-yellow-500/30',
    founder: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/30',
    co_founder: 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-orange-500/30',
    ceo: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30',
    admin: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30',
    moderator: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/30',
    friend: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-pink-500/30',
    vip: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-yellow-500/40',
    premium: 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-fuchsia-500/30',
  };
  return styles[role] || 'bg-muted text-muted-foreground';
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: '👑 OWNER',
    founder: '⭐ FOUNDER',
    co_founder: '✦ CO-FOUNDER',
    ceo: '💎 CEO',
    admin: '🛡️ ADMIN',
    moderator: '⚔️ MOD',
    friend: '💖 FRIEND',
    vip: '✨ VIP',
    premium: '💫 PREMIUM',
  };
  return labels[role] || role.toUpperCase();
};

const getFileIcon = (type: string) => {
  if (type?.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (type?.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
  if (type?.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
  if (type?.includes('zip') || type?.includes('rar')) return <FileArchive className="h-4 w-4" />;
  if (type?.includes('pdf') || type?.includes('doc')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function MessageBubble({
  id,
  content,
  imageUrl,
  fileName,
  fileType,
  senderName,
  senderAvatar,
  senderId,
  currentUserId,
  createdAt,
  editedAt,
  isDeleted,
  deletedBy,
  userRole,
  isGrouped,
  replyTo,
  isAdmin,
  onEdit,
  onDelete,
  onReply,
  onModerate,
  onViewProfile,
  onDismiss
}: MessageBubbleProps) {
  const isOwnMessage = senderId === currentUserId;
  const canModify = isOwnMessage || isAdmin;

  // Render file attachment
  const renderFileAttachment = () => {
    if (!imageUrl) return null;

    const isImage = fileType?.startsWith('image/') || imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    if (isImage) {
      return (
        <img 
          src={imageUrl} 
          alt={fileName || 'Image'} 
          className="max-w-[280px] max-h-[280px] rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(imageUrl, '_blank')}
        />
      );
    }

    return (
      <a 
        href={imageUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-background/50 rounded-lg mb-2 hover:bg-background/80 transition-colors"
      >
        {getFileIcon(fileType || '')}
        <span className="text-sm truncate max-w-[200px]">{fileName || 'File'}</span>
        <Download className="h-3 w-3 ml-auto flex-shrink-0" />
      </a>
    );
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} ${isDeleted ? 'opacity-50' : ''} ${isGrouped ? 'mt-1' : 'mt-4'}`}>
      {/* Avatar - hide for grouped messages */}
      {!isGrouped ? (
        <Avatar 
          className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={() => onViewProfile?.(senderId, senderName)}
        >
          {senderAvatar && <AvatarImage src={senderAvatar} alt={senderName} />}
          <AvatarFallback className="text-xs bg-muted">{getInitials(senderName)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8" /> 
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Header - hide for grouped messages */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium">
              {isOwnMessage ? 'You' : senderName}
            </span>
            {userRole && userRole !== 'user' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm ${getRoleBadgeStyle(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{formatTime(createdAt)}</span>
            {editedAt && <span className="text-xs text-muted-foreground italic">(edited)</span>}
          </div>
        )}

        {/* Reply indicator */}
        {replyTo && (
          <div className={`text-xs text-muted-foreground mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-primary max-w-full`}>
            <span className="font-medium">↩ {replyTo.senderName}: </span>
            <span className="truncate">{replyTo.content.substring(0, 40)}{replyTo.content.length > 40 ? '...' : ''}</span>
          </div>
        )}

        {/* Message bubble */}
        <div className="flex items-start gap-2">
          <div
            className={`rounded-2xl px-4 py-2 ${
              isDeleted 
                ? 'bg-destructive/20 text-destructive'
                : isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            {!isDeleted && renderFileAttachment()}
            {(content || isDeleted) && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {isDeleted && isAdmin ? (
                  <>
                    <span className="text-destructive font-medium">[Deleted]</span>
                    <br />
                    <span className="line-through">{content}</span>
                  </>
                ) : isDeleted ? (
                  '[Message deleted]'
                ) : (
                  content
                )}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isDeleted && canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReply?.({ id, content, senderId, senderName })}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem onClick={() => onEdit?.(id, content)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canModify && (
                  <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {isAdmin && !isOwnMessage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onModerate?.(senderId, senderName)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Moderate User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Reply button for non-owners */}
          {!isDeleted && !isOwnMessage && !isAdmin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onReply?.({ id, content, senderId, senderName })}
            >
              <Reply className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
