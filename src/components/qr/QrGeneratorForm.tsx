"use client";

import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Download, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPickerField } from "@/components/qr/ColorPickerField";
import { LogoUploader } from "@/components/qr/LogoUploader";
import { useQrDownload } from "@/hooks/use-qr-download";
import { createQrCode } from "@/actions/qr-actions";
import { errorCorrectionLevels, qrFormSchema, type QrFormValues } from "@/lib/qr-schema";

const defaultValues: QrFormValues = {
  name: "",
  data: "",
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  size: 256,
  level: "M",
  logoDataUrl: undefined,
};

export function QrGeneratorForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const download = useQrDownload();
  const [isSaving, startSaving] = useTransition();

  const form = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues,
  });

  const values = form.watch();
  const hasContent = values.data.trim().length > 0;

  function handleDownload() {
    download(canvasRef.current, values.name || "qr-code");
  }

  function onSubmit(data: QrFormValues) {
    startSaving(async () => {
      try {
        await createQrCode(data);
        toast.success("QR code saved");
      } catch {
        toast.error("Could not save the QR code");
      }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="https://example.com" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="My QR code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fgColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foreground</FormLabel>
                  <FormControl>
                    <ColorPickerField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bgColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background</FormLabel>
                  <FormControl>
                    <ColorPickerField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size — {field.value}px</FormLabel>
                <FormControl>
                  <Slider
                    min={128}
                    max={1024}
                    step={32}
                    value={[field.value]}
                    onValueChange={([v]) => field.onChange(v)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Error correction</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {errorCorrectionLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Higher levels tolerate more damage. Use H if you add a logo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logoDataUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo (optional)</FormLabel>
                <FormControl>
                  <LogoUploader value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleDownload} disabled={!hasContent}>
              <Download /> Download PNG
            </Button>
            <Button type="submit" disabled={!hasContent || isSaving}>
              <Save /> {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex items-start justify-center">
        <Card className="sticky top-8">
          <CardContent className="flex items-center justify-center p-8">
            {hasContent ? (
              <QRCodeCanvas
                ref={canvasRef}
                value={values.data}
                size={values.size}
                fgColor={values.fgColor}
                bgColor={values.bgColor}
                level={values.level}
                imageSettings={
                  values.logoDataUrl
                    ? {
                        src: values.logoDataUrl,
                        height: values.size * 0.2,
                        width: values.size * 0.2,
                        excavate: true,
                      }
                    : undefined
                }
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Enter some content to preview the QR code
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
