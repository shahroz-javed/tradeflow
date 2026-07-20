import { useEffect, useRef, useState } from 'react'
import { parseSpokenNumber } from '../utils/speechNumber'

const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const VOICE_SUPPORTED = !!SpeechRecognition

/**
 * Voice-to-number input. Call startListening(fieldKey) from a mic button;
 * onResult(fieldKey, number) fires once a final transcript is parsed.
 */
export function useVoiceNumberInput(onResult) {
  const [activeField, setActiveField] = useState(null)
  const [status, setStatus] = useState('')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  function startListening(fieldKey) {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (activeField === fieldKey) {
      recognition.stop()
      setActiveField(null)
      setStatus('Stopped.')
      return
    }

    if (activeField) recognition.stop()

    recognition.onstart = () => {
      setActiveField(fieldKey)
      setStatus('🔴 Listening… speak the number now')
      setTranscript('')
    }

    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      setTranscript(text)
      if (e.results[e.results.length - 1].isFinal) {
        const num = parseSpokenNumber(text)
        if (num !== null) {
          setStatus(`✓ Set to ${num}`)
          onResult(fieldKey, num)
        } else {
          setStatus("Couldn't parse a number — try again")
        }
        setActiveField(null)
      }
    }

    recognition.onerror = (e) => {
      setStatus(`Error: ${e.error}. Try again.`)
      setActiveField(null)
    }

    recognition.onend = () => {
      setActiveField((current) => (current === fieldKey ? null : current))
    }

    recognition.start()
  }

  return { activeField, status, transcript, startListening }
}
