"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, SkipForward, SkipBack, Music, Plus, X, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Song {
  id: string
  title: string
  url: string
}

export function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAddSong, setShowAddSong] = useState(false)
  const [newSongTitle, setNewSongTitle] = useState("")
  const [newSongUrl, setNewSongUrl] = useState("")
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load songs from localStorage on mount
  useEffect(() => {
    const savedSongs = localStorage.getItem("noela-favorite-songs")
    if (savedSongs) {
      setSongs(JSON.parse(savedSongs))
    } else {
      const defaultSongs: Song[] = [
        {
          id: "1",
          title: "Endor - Pump It Up",
          url: "https://cdn.pixabay.com/audio/2024/01/23/audio_c0c2e1d6e1.mp3",
        },
        {
          id: "2",
          title: "Lofi Chill Beats",
          url: "https://cdn.pixabay.com/audio/2024/02/19/audio_bea04fc2f4.mp3",
        },
        {
          id: "3",
          title: "Dreamy Synth",
          url: "https://cdn.pixabay.com/audio/2024/02/15/audio_c13c4a097e.mp3",
        },
      ]
      setSongs(defaultSongs)
      localStorage.setItem("noela-favorite-songs", JSON.stringify(defaultSongs))
    }
  }, [])

  useEffect(() => {
    const attemptAutoplay = async () => {
      if (audioRef.current && songs.length > 0) {
        try {
          // Try to play with sound first
          await audioRef.current.play()
          setIsPlaying(true)
          console.log("[v0] Autoplay successful")
        } catch (err) {
          // If blocked, try muted autoplay
          console.log("[v0] Autoplay blocked, trying muted:", err)
          try {
            audioRef.current.muted = true
            await audioRef.current.play()
            // Unmute after successful muted play
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.muted = false
              }
            }, 500)
            setIsPlaying(true)
          } catch (mutedErr) {
            console.log("[v0] Muted autoplay also blocked, waiting for user interaction")
            setIsPlaying(false)
          }
        }
      }
    }

    const timer = setTimeout(attemptAutoplay, 1000)
    return () => clearTimeout(timer)
  }, [songs])

  // Save songs to localStorage whenever they change
  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem("noela-favorite-songs", JSON.stringify(songs))
    }
  }, [songs])

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current || songs.length === 0) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Handle next/previous
  const playNext = () => {
    if (songs.length === 0) return
    const nextIndex = (currentSongIndex + 1) % songs.length
    setCurrentSongIndex(nextIndex)
    setIsPlaying(true)
  }

  const playPrevious = () => {
    if (songs.length === 0) return
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1
    setCurrentSongIndex(prevIndex)
    setIsPlaying(true)
  }

  // Auto-play when song changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play()
    }
  }, [currentSongIndex])

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Add song from URL
  const addSongFromUrl = () => {
    if (!newSongTitle.trim() || !newSongUrl.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both song title and URL",
        variant: "destructive",
      })
      return
    }

    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle,
      url: newSongUrl,
    }

    setSongs([...songs, newSong])
    setNewSongTitle("")
    setNewSongUrl("")
    setShowAddSong(false)

    toast({
      title: "Song added!",
      description: `${newSongTitle} has been added to your favorites`,
    })
  }

  // Add song from file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an audio file (MP3, WAV, etc.)",
        variant: "destructive",
      })
      return
    }

    const url = URL.createObjectURL(file)
    const newSong: Song = {
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      url: url,
    }

    setSongs([...songs, newSong])
    toast({
      title: "Song added!",
      description: `${newSong.title} has been added to your favorites`,
    })
  }

  // Remove song
  const removeSong = (id: string) => {
    setSongs(songs.filter((song) => song.id !== id))
    if (currentSongIndex >= songs.length - 1) {
      setCurrentSongIndex(Math.max(0, songs.length - 2))
    }
  }

  const currentSong = songs[currentSongIndex]

  const [isMinimized, setIsMinimized] = useState(true)

  if (isMinimized) {
    return (
      <Card className="border-blue-200 shadow-lg bg-white/95 backdrop-blur w-fit ml-auto">
        <CardContent className="p-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-md animate-spin-slow">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col mr-2">
            <span className="text-xs font-bold text-blue-900 max-w-[100px] truncate">
              {currentSong?.title || "Noela Radio"}
            </span>
            <span className="text-[10px] text-muted-foreground">{isPlaying ? "Playing" : "Paused"}</span>
          </div>
          <Button onClick={toggleMute} size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50 rounded-full">
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
          </Button>
          <Button
            onClick={togglePlay}
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-blue-50 rounded-full"
            disabled={songs.length === 0}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-blue-600" /> : <Play className="w-4 h-4 text-blue-600" />}
          </Button>
          <Button
            onClick={() => setIsMinimized(false)}
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-blue-50 rounded-full"
          >
            <SkipForward className="w-4 h-4 rotate-90 text-gray-400" />
          </Button>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentSong?.url}
            onEnded={playNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 shadow-lg bg-white/95 backdrop-blur">
      <CardContent className="p-4 relative">
        <Button
          onClick={() => setIsMinimized(true)}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="space-y-4 mt-2">
          {/* Current Song Display */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-md">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">{currentSong?.title || "No song selected"}</p>
              <p className="text-xs text-muted-foreground">
                {songs.length > 0 ? `${currentSongIndex + 1} of ${songs.length}` : "Add songs to play"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={playPrevious}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              disabled={songs.length === 0}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              onClick={togglePlay}
              size="icon"
              className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={songs.length === 0}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              onClick={playNext}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              disabled={songs.length === 0}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button onClick={toggleMute} variant="ghost" size="icon" className="h-8 w-8">
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number.parseFloat(e.target.value))
                if (isMuted) setIsMuted(false)
              }}
              className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Add Song Section */}
          {showAddSong ? (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
              <Input placeholder="Song title" value={newSongTitle} onChange={(e) => setNewSongTitle(e.target.value)} />
              <Input
                placeholder="Audio URL (MP3, etc.)"
                value={newSongUrl}
                onChange={(e) => setNewSongUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={addSongFromUrl} size="sm" className="flex-1">
                  Add from URL
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                  Upload File
                </Button>
                <Button onClick={() => setShowAddSong(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </div>
          ) : (
            <Button onClick={() => setShowAddSong(true)} variant="outline" size="sm" className="w-full border-blue-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Favorite Song
            </Button>
          )}

          {/* Song List */}
          {songs.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {songs.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    index === currentSongIndex ? "bg-blue-100" : "hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentSongIndex(index)
                      setIsPlaying(true)
                    }}
                    className="flex-1 text-left truncate"
                  >
                    {song.title}
                  </button>
                  <Button onClick={() => removeSong(song.id)} variant="ghost" size="icon" className="h-6 w-6">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentSong?.url}
            onEnded={playNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
