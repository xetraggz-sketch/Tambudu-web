'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user/UserAvatar';
import {
  updateAvatarEmojiAction,
  updateAvatarImageAction,
  removeAvatarImageAction,
} from '@/app/profile/actions';

const AVATAR_EMOJIS = [
  '😀','😎','🦊','🐱','🐼','🚀','🌸','🎨','🎵','📚',
  '⚽','🍕','🎬','🌍','🌟','🔥','💜','🎭','🏔️','🌊',
  '🚲','🍃','☕','🎪','🎁','🎮','🎲','🎯','🌙','☀️',
];

type AvatarPickerProps = {
  user: {
    id: string;
    name?: string | null;
    avatarEmoji: string;
    hasAvatarImage: boolean;
  };
};

export function AvatarPicker({ user }: AvatarPickerProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [open, setOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(user.avatarEmoji);
  const [isPending, startTransition] = useTransition();
  const [cacheBust, setCacheBust] = useState(() => Date.now());

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSave = () => {
    startTransition(async () => {
      const result = await updateAvatarEmojiAction(selectedEmoji);
      if (result.ok) {
        toast.success('Аватар обновлён');
        await updateSession({ avatarEmoji: selectedEmoji, hasAvatarImage: false });
        router.refresh();
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      size,
      size,
    );

    const qualities = [0.85, 0.8, 0.7, 0.6];
    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', q),
      );
      if (blob && blob.size <= 100 * 1024) return blob;
      if (q === qualities[qualities.length - 1]) return blob;
    }
    return null;
  }, [completedCrop]);

  const handleImageSave = () => {
    startTransition(async () => {
      const blob = await getCroppedBlob();
      if (!blob) {
        toast.error('Не удалось обработать изображение');
        return;
      }
      if (blob.size > 100 * 1024) {
        toast.error('Картинка слишком детальная, попробуй другую');
        return;
      }
      const fd = new FormData();
      fd.append('file', blob, 'avatar.webp');
      const result = await updateAvatarImageAction(fd);
      if (result.ok) {
        toast.success('Аватар обновлён');
        setImgSrc('');
        setCacheBust(Date.now());
        await updateSession({ hasAvatarImage: true });
        router.refresh();
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Ошибка');
      }
    });
  };

  const handleRemoveImage = () => {
    startTransition(async () => {
      const result = await removeAvatarImageAction();
      if (result.ok) {
        toast.success('Картинка удалена');
        setCacheBust(Date.now());
        await updateSession({ hasAvatarImage: false });
        router.refresh();
      } else {
        toast.error('Ошибка при удалении');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer rounded-full ring-2 ring-transparent hover:ring-[color:var(--color-volga)] transition-all"
            aria-label="Изменить аватар"
          />
        }
      >
        <UserAvatar user={user} size="xl" ts={cacheBust} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Изменить аватар</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="emoji">
          <TabsList className="w-full">
            <TabsTrigger value="emoji">Эмодзи</TabsTrigger>
            <TabsTrigger value="image">Своя картинка</TabsTrigger>
          </TabsList>

          <TabsContent value="emoji" className="mt-4">
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  data-selected={selectedEmoji === emoji || undefined}
                  className="aspect-square rounded-md text-2xl flex items-center justify-center hover:bg-muted data-[selected]:ring-2 data-[selected]:ring-[color:var(--color-volga)] data-[selected]:bg-muted"
                  aria-label={`Эмодзи ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={handleEmojiSave}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin size-4 mr-1.5" />}
              Сохранить
            </Button>
          </TabsContent>

          <TabsContent value="image" className="mt-4 space-y-4">
            {user.hasAvatarImage && !imgSrc && (
              <div className="flex items-center gap-4">
                <img
                  src={`/api/users/${user.id}/avatar?ts=${cacheBust}`}
                  alt="Текущий аватар"
                  width={96}
                  height={96}
                  className="rounded-full object-cover bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin size-4 mr-1.5" />
                  ) : (
                    <Trash2 className="size-4 mr-1.5" />
                  )}
                  Удалить картинку
                </Button>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4 mr-1.5" />
                Выбрать файл
              </Button>
            </div>

            {imgSrc && (
              <>
                <div className="flex justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    minWidth={64}
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt="Кроп"
                      style={{ maxHeight: 300 }}
                    />
                  </ReactCrop>
                </div>
                <Button
                  className="w-full"
                  onClick={handleImageSave}
                  disabled={isPending || !completedCrop}
                >
                  {isPending && (
                    <Loader2 className="animate-spin size-4 mr-1.5" />
                  )}
                  Сохранить
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
