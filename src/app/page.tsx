/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useRef } from "react"
import { Upload, Lock, Unlock, Download, ImageIcon, RefreshCw, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { encode, decode } from "@/lib/steganography"

export default function SteganographyApp() {
  const [activeTab, setActiveTab] = useState("encode")
  
  // Encode State
  const [encodeFile, setEncodeFile] = useState<File | null>(null)
  const [encodePreview, setEncodePreview] = useState<string | null>(null)
  const [secretText, setSecretText] = useState("")
  const [stegoImage, setStegoImage] = useState<string | null>(null)
  const [isEncoding, setIsEncoding] = useState(false)
  const [embeddedText, setEmbeddedText] = useState<string | null>(null)

  // Decode State
  const [decodeFile, setDecodeFile] = useState<File | null>(null)
  const [decodePreview, setDecodePreview] = useState<string | null>(null)
  const [decodedText, setDecodedText] = useState<string | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)

  const encodeFileInputRef = useRef<HTMLInputElement>(null)
  const decodeFileInputRef = useRef<HTMLInputElement>(null)

  const handleEncodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEncodeFile(file)
      setEncodePreview(URL.createObjectURL(file))
      setStegoImage(null)
      setEmbeddedText(null)
    }
  }

  const handleDecodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setDecodeFile(file)
      setDecodePreview(URL.createObjectURL(file))
      setDecodedText(null)
    }
  }

  const handleEncode = async () => {
    if (!encodeFile || !secretText) return
    
    setIsEncoding(true)
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100))
      const result = await encode(encodeFile, secretText)
      setStegoImage(result)
      setEmbeddedText(secretText)
    } catch (error) {
      console.error("Encoding failed:", error)
      alert("Failed to encode text. The image might be too small for this amount of text.")
    } finally {
      setIsEncoding(false)
    }
  }

  const handleDecode = async () => {
    if (!decodeFile) return

    setIsDecoding(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const text = await decode(decodeFile)
      setDecodedText(text || "No hidden message found.")
    } catch (error) {
      console.error("Decoding failed:", error)
      alert("Failed to decode image.")
    } finally {
      setIsDecoding(false)
    }
  }

  const downloadStegoImage = () => {
    if (!stegoImage) return
    const link = document.createElement("a")
    link.href = stegoImage
    link.download = "stego-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Steganography</h1>
          <p className="text-muted-foreground text-sm md:text-base">Securely hide text messages within images.</p>
        </header>

        <Tabs defaultValue="encode" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="encode">Hide Text</TabsTrigger>
              <TabsTrigger value="decode">Reveal Text</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="encode" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Source Image
                  </CardTitle>
                  <CardDescription>Select an image to hide your message in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-none hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center h-48 md:h-64 relative overflow-hidden"
                    onClick={() => encodeFileInputRef.current?.click()}
                  >
                    {encodePreview ? (
                      <img src={encodePreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Click to upload image</p>
                        <p className="text-xs opacity-50 mt-1">PNG, JPG supported</p>
                      </div>
                    )}
                    <Input 
                      type="file" 
                      ref={encodeFileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleEncodeFileChange} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Secret Message
                  </CardTitle>
                  <CardDescription>Enter the text you want to hide.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Type your secret message here..." 
                    className="min-h-[150px] md:min-h-[256px] resize-none font-mono text-sm border-muted-foreground/20 focus-visible:ring-1"
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleEncode} 
                disabled={!encodeFile || !secretText || isEncoding}
                className="w-full md:w-auto min-w-[200px]"
              >
                {isEncoding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Hide Message <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {stegoImage && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-primary/10 shadow-md overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Check className="w-5 h-5" /> Result
                    </CardTitle>
                    <CardDescription>Your message has been embedded successfully.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                      <div className="p-4 md:p-6 space-y-4">
                        <Label className="text-muted-foreground uppercase text-xs tracking-wider">Stego Image</Label>
                        <div className="border border-border/50 bg-muted/10 h-48 md:h-64 flex items-center justify-center relative">
                          <img src={stegoImage} alt="Stego Result" className="max-w-full max-h-full object-contain" />
                        </div>
                        <Button variant="outline" className="w-full" onClick={downloadStegoImage}>
                          <Download className="w-4 h-4 mr-2" /> Download Image
                        </Button>
                      </div>
                      <div className="p-4 md:p-6 space-y-4 bg-muted/5">
                        <Label className="text-muted-foreground uppercase text-xs tracking-wider">Embedded Text</Label>
                        <div className="p-4 bg-background border border-border/50 h-48 md:h-64 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-muted-foreground">
                          {embeddedText}
                        </div>
                        <div className="text-xs text-center text-muted-foreground pt-2">
                          This text is now hidden inside the image pixels.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decode" className="space-y-6">
            <Card className="border-0 shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="w-5 h-5" /> Reveal Message
                </CardTitle>
                <CardDescription>Upload an image containing a hidden message.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-none hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center h-48 md:h-64 relative overflow-hidden"
                  onClick={() => decodeFileInputRef.current?.click()}
                >
                  {decodePreview ? (
                    <img src={decodePreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Click to upload stego-image</p>
                    </div>
                  )}
                  <Input 
                    type="file" 
                    ref={decodeFileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleDecodeFileChange} 
                  />
                </div>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleDecode} 
                    disabled={!decodeFile || isDecoding}
                    className="min-w-[200px]"
                  >
                    {isDecoding ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Decoding...
                      </>
                    ) : (
                      <>
                        Reveal Message <Unlock className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {decodedText !== null && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
                    <Label className="mb-2 block">Decoded Message</Label>
                    <div className="p-6 bg-muted/20 border border-border rounded-none min-h-[100px] font-mono text-sm whitespace-pre-wrap">
                      {decodedText}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}