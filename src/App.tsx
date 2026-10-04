import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type CSSProperties, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowDown, ArrowLeft, ArrowRight, BarChart3, Camera, Check, ChevronDown, CircleHelp, Clock3, Download, FileImage, Flower2, Globe2, HeartPulse, Leaf, Menu, Microscope, Search, ShieldCheck, Sparkles, Sprout, Trash2, Upload, X } from 'lucide-react'
import { analyzePlant } from './api'
import { clearReports, deleteReport, getReports, makePreview, saveReport, type PlantReport } from './history'
import { getTranslations, languageOptions, type Language, type Translation, type TranslationKey } from './translations'

const LANG_KEY = 'plantix-language'

function readLanguage(): Language {
  const stored = localStorage.getItem(LANG_KEY)
  return languageOptions.some(option => option.code === stored) ? stored as Language : 'en'
}

function Logo({ light = false }: { light?: boolean }) {
  return <span className={`brand-mark${light ? ' brand-mark-light' : ''}`}><span className="brand-icon"><Leaf size={19} fill="currentColor" /></span><span>PLANTIX</span></span>
}

function localeFor(language: Language): string {
  return { en: 'en', te: 'te-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', ur: 'ur-PK' }[language]
}

function displayPlant(report: PlantReport, t: Translation): string {
  return report.provider === 'demo' ? t.demoPlant : report.plant.name
}

function displayCondition(report: PlantReport, t: Translation): string {
  return report.provider === 'demo' ? t.demoCondition : report.diagnosis.name
}

function displayList(report: PlantReport, section: 'symptoms' | 'care' | 'nutrition' | 'prevention', t: Translation): string[] {
  if (report.provider !== 'demo') {
    if (section === 'symptoms') return report.symptoms.associated
    return report[section]
  }
  if (section === 'symptoms') return [t.demoSymptomBrown, t.demoSymptomYellow, t.demoSymptomDry]
  if (section === 'care') return [t.demoCareCompare, t.demoCareRemove, t.demoCareWater]
  if (section === 'nutrition') return [t.demoNutritionImage, t.demoNutritionSoil]
  return [t.demoPreventAir, t.demoPreventClean, t.demoPreventExpert]
}

function App() {
  const [language, setLanguage] = useState<Language>(readLanguage)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const t = useMemo(() => getTranslations(language), [language])
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr'
    localStorage.setItem(LANG_KEY, language)
  }, [language])

  const flash = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3600)
  }, [])

  return (
    <div className="app-shell">
      <Header t={t} language={language} setLanguage={setLanguage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <Routes>
          <Route path="/" element={<Home t={t} />} />
          <Route path="/detect" element={<Detect t={t} onSaved={id => navigate(`/report/${id}`)} />} />
          <Route path="/history" element={<HistoryPage t={t} language={language} />} />
          <Route path="/report/:id" element={<ReportPage t={t} language={language} flash={flash} />} />
          <Route path="/about" element={<About t={t} />} />
          <Route path="/settings" element={<Settings t={t} language={language} setLanguage={setLanguage} />} />
          <Route path="*" element={<NotFound t={t} />} />
        </Routes>
      </main>
      <Footer t={t} />
      <AnimatePresence>
        {toast && <motion.div className="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} role="status"><CircleHelp size={17} />{toast}</motion.div>}
      </AnimatePresence>
    </div>
  )
}

function Header({ t, language, setLanguage, menuOpen, setMenuOpen }: {
  t: Translation; language: Language; setLanguage: (language: Language) => void; menuOpen: boolean; setMenuOpen: (open: boolean) => void
}) {
  const links = [['/', t.home], ['/detect', t.detect], ['/history', t.history], ['/about', t.about]] as const
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link to="/" className="logo-link" aria-label={t.homeLabel}><Logo /></Link>
        <nav className={`main-nav${menuOpen ? ' nav-open' : ''}`} aria-label={t.navLabel}>
          {links.map(([path, label]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
          <NavLink to="/settings" className="mobile-settings" onClick={() => setMenuOpen(false)}>{t.settings}</NavLink>
          <LanguagePicker language={language} setLanguage={setLanguage} />
        </nav>
        <div className="header-actions">
          <LanguagePicker language={language} setLanguage={setLanguage} compact />
          <Link className="header-cta" to="/detect">{t.getStarted}<ArrowRight size={15} /></Link>
          <button className="menu-toggle icon-button" aria-label={t.menuLabel} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
  )
}

function LanguagePicker({ language, setLanguage, compact = false }: { language: Language; setLanguage: (language: Language) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const selected = languageOptions.find(option => option.code === language)!
  return (
    <div className={`language-picker${compact ? ' language-compact' : ''}`}>
      <button className="language-trigger" aria-expanded={open} onClick={() => setOpen(!open)}><Globe2 size={16} /><span>{compact ? selected.native : `🌐 ${selected.native}`}</span><ChevronDown size={14} /></button>
      <AnimatePresence>
        {open && <motion.div className="language-menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
          {languageOptions.map(option => <button key={option.code} className={language === option.code ? 'language-selected' : ''} onClick={() => { setLanguage(option.code); setOpen(false) }}><span>{option.native}</span>{language === option.code && <Check size={14} />}</button>)}
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}

const crops: { key: TranslationKey; emoji: string; className: string; noteKey: TranslationKey }[] = [
  { key: 'tomato', emoji: '🍅', className: 'crop-tomato', noteKey: 'cropDescription' },
  { key: 'potato', emoji: '🥔', className: 'crop-potato', noteKey: 'cropDescription' },
  { key: 'corn', emoji: '🌽', className: 'crop-corn', noteKey: 'cropDescription' },
  { key: 'apple', emoji: '🍎', className: 'crop-apple', noteKey: 'cropDescription' },
  { key: 'chilli', emoji: '🌶️', className: 'crop-chilli', noteKey: 'cropDescription' },
  { key: 'brinjal', emoji: '🍆', className: 'crop-brinjal', noteKey: 'cropDescription' },
  { key: 'rice', emoji: '🌾', className: 'crop-rice', noteKey: 'cropDescription' },
  { key: 'other', emoji: '🌿', className: 'crop-other', noteKey: 'cropDescription' },
]

function Home({ t }: { t: Translation }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className="home-page">
      <section className="hero section-container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />{t.heroBadge}</div>
          <h1>{t.heroTitle}</h1>
          <p className="hero-description">{t.heroText}</p>
          <div className="hero-buttons">
            <Link to="/detect" className="button button-primary button-large"><Leaf size={19} />{t.getStarted}<ArrowRight className="button-arrow" size={18} /></Link>
            <a href="#how-it-works" className="button button-quiet"><span className="play-dot">↗</span>{t.howWorks}</a>
          </div>
          <div className="hero-proof"><div className="avatar-stack"><span>🌱</span><span>🌾</span><span>🍃</span></div><span>{t.tagline}</span></div>
        </div>
        <div className="hero-art" aria-label={t.heroVisualAlt}>
          <div className="sun-orb" />
          <div className="art-ring art-ring-one" /><div className="art-ring art-ring-two" />
          <motion.div className="leaf-orbit orbit-a" animate={reduceMotion ? undefined : { y: [0, -11, 0], rotate: [0, 4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>🍃</motion.div>
          <motion.div className="leaf-orbit orbit-b" animate={reduceMotion ? undefined : { y: [0, 10, 0], rotate: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>🌿</motion.div>
          <div className="hero-plant">
            <span className="plant-sparkle sparkle-one">✳</span><span className="plant-sparkle sparkle-two">✦</span>
            <div className="plant-stem" /><div className="plant-leaf leaf-one" /><div className="plant-leaf leaf-two" />
            <div className="plant-leaf leaf-three" /><div className="plant-leaf leaf-four" /><div className="plant-leaf leaf-five" />
            <div className="plant-pot"><div className="pot-rim" /><div className="pot-body" /></div>
          </div>
          <div className="floating-card card-health"><span className="health-check"><Check size={14} /></span><div><strong>{t.plantHealth}</strong><small>{t.oneLeaf}</small></div></div>
          <div className="floating-card card-ai"><Sparkles size={15} /><span>{t.aiInsights}</span></div>
          <div className="hero-image-caption"><span>01</span><span>{t.growConfidence}</span></div>
        </div>
        <div className="hero-bottom"><span className="hero-bottom-leaf">✳</span><span>{t.footerNote}</span><ArrowDown size={15} /></div>
      </section>
      <section className="trust-strip section-container" aria-label={t.statsLabel}>
        <div><strong>01</strong><span>{t.scans}</span></div><div><strong>08</strong><span>{t.plants}</span></div><div><strong>06</strong><span>{t.languages}</span></div><div><Sprout size={18} /><span>{t.availability}</span></div>
      </section>
      <section className="crops-section section-container" id="crops">
        <div className="section-heading"><div><span className="section-kicker">{t.homeKicker}</span><h2>{t.cropsTitle}</h2><p>{t.cropsText}</p></div><Link className="text-link" to="/detect">{t.getStarted}<ArrowRight size={17} /></Link></div>
        <div className="crop-grid">{crops.map(crop => <Link to="/detect" className={`crop-card ${crop.className}`} key={crop.key}><div className="crop-visual"><span>{crop.emoji}</span><i /><i /><i /></div><div className="crop-meta"><strong>{t[crop.key]}</strong><small>{t[crop.noteKey]}</small></div><ArrowRight className="crop-arrow" size={16} /></Link>)}</div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="section-container">
          <div className="section-heading centered"><div><span className="section-kicker">{t.howKicker}</span><h2>{t.howTitle}</h2></div></div>
          <div className="steps-grid">{([
            ['01', '📷', t.stepCapture, 'step-green'], ['02', '🧠', t.stepAnalyze, 'step-yellow'], ['03', '🌿', t.stepIdentify, 'step-green'],
            ['04', '💡', t.stepLearn, 'step-orange'], ['05', '🌾', t.stepImprove, 'step-green'],
          ] as const).map(([number, icon, title, color]) => <motion.article key={number} className="step-card" whileHover={reduceMotion ? undefined : { y: -5 }}><span className={`step-icon ${color}`}>{icon}</span><span className="step-number">{number}</span><h3>{title}</h3><p>{t[`step${number === '01' ? 'Capture' : number === '02' ? 'Analyze' : number === '03' ? 'Identify' : number === '04' ? 'Learn' : 'Improve'}Text` as TranslationKey]}</p></motion.article>)}</div>
        </div>
      </section>
      <section className="cta-section section-container"><div className="cta-leaf">🌿</div><div><span className="section-kicker">{t.ctaKicker}</span><h2>{t.heroTitle}</h2><p>{t.disclaimerShort}</p></div><Link to="/detect" className="button button-light">{t.getStarted}<ArrowRight size={17} /></Link></section>
    </div>
  )
}

function Detect({ t, onSaved }: { t: Translation; onSaved: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [cameraSelected, setCameraSelected] = useState(false)
  const [preview, setPreview] = useState('')
  const [qualityWarning, setQualityWarning] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [cameraOpen, setCameraOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) { setPreview(''); setQualityWarning(false); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 24
        canvas.height = 24
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return
        context.drawImage(image, 0, 0, 24, 24)
        const pixels = context.getImageData(0, 0, 24, 24).data
        let luminance = 0
        for (let i = 0; i < pixels.length; i += 4) luminance += (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722)
        setQualityWarning(luminance / (pixels.length / 4) < 42)
      } catch { setQualityWarning(false) }
    }
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => setStep(value => Math.min(value + 1, 2)), 1650)
    return () => window.clearInterval(timer)
  }, [busy])

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    if (file) { setError(t.replaceNotice); return }
    const extensionValid = /\.(jpe?g|png|webp)$/i.test(chosen.name)
    const mimeValid = ['image/jpeg', 'image/png', 'image/webp'].includes(chosen.type)
    if (!extensionValid || !mimeValid) { setError(t.fileTypeError); return }
    if (chosen.size > 10 * 1024 * 1024) { setError(t.fileSizeError); return }
    try {
      await decodeImage(chosen)
      setFile(chosen)
      setCameraSelected(false)
      setError('')
    } catch { setError(t.decodeError) }
  }

  const beginCamera = async () => {
    if (file) { setError(t.replaceNotice); return }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }
    setError('')
    setCameraOpen(true)
  }

  const analyze = async () => {
    if (!file || busy) return
    setBusy(true)
    setStep(0)
    setError('')
    try {
      const result = await analyzePlant(file)
      const report: PlantReport = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        filename: file.name,
        image: await makePreview(file),
      }
      await saveReport(report)
      onSaved(report.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.loadingError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-container detect-page">
      <div className="page-heading"><div className="eyebrow"><span className="eyebrow-dot" />{t.healthCheck}</div><h1>{t.detectTitle}</h1><p>{t.detectText}</p></div>
      <div className="detect-layout">
        <div className="detect-main">
          <div className="detection-card">
            {!file ? <div className="source-grid">
              <button className="source-option upload-option" onClick={() => inputRef.current?.click()}><span className="source-icon"><Upload /></span><strong>{t.upload}</strong><small>{t.uploadHint}</small><span className="source-action"><FileImage size={15} />{t.browseFiles}</span></button>
              <button className="source-option camera-option" onClick={beginCamera}><span className="source-icon camera-source"><Camera /></span><strong>{t.camera}</strong><small>{t.cameraHint}</small><span className="source-action"><Camera size={15} />{t.openCamera}</span></button>
              <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={event => void chooseFile(event)} />
              <input ref={cameraInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" capture="environment" onChange={event => void chooseFile(event)} />
            </div> : <div className="selected-image-area">
              <div className="preview-frame"><img src={preview || undefined} alt={t.selectedImage} /><span className="preview-label"><Check size={13} />{t.selectedImage}</span></div>
              <div className="preview-details"><div><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type.replace('image/', '').toUpperCase()}</span></div><div className="preview-actions">{cameraSelected && <button className="remove-image" onClick={() => { setFile(null); setCameraOpen(true); setError('') }}><Camera size={15} />{t.retake}</button>}<button className="remove-image" onClick={() => { setFile(null); setCameraSelected(false); setError('') }}><Trash2 size={15} />{t.remove}</button></div></div>
              {qualityWarning && <div className="inline-warning"><CircleHelp size={17} /><span>{t.qualityWarning}</span></div>}
              <button className="button button-primary analyze-button" onClick={() => void analyze()} disabled={busy}><Microscope size={18} />{busy ? t.scanning : t.analyze}<ArrowRight size={17} /></button>
            </div>}
            {error && <div className="inline-error" role="alert"><CircleHelp size={17} /><span>{error}</span></div>}
            {busy && <div className="scan-progress" role="status"><span className="scan-spinner" /><div><strong>{t.scanSteps[step]}</strong><small>{t.scanning}</small></div><span className="scan-dots"><i /><i /><i /></span></div>}
          </div>
          <div className="privacy-note"><ShieldCheck size={18} /><span>{t.storageSetting}</span></div>
        </div>
        <aside className="detect-aside">
          <div className="aside-title"><span><Leaf size={19} /></span><h3>{t.tipsTitle}</h3></div>
          <ul className="photo-tips"><li><Check />{t.tipSingleLeaf}</li><li><Check />{t.tipLight}</li><li><Check />{t.tipSteady}</li><li><Check />{t.tipBackground}</li></ul>
          <div className="aside-divider" /><p className="aside-note"><CircleHelp size={17} />{t.localExpertWarning}</p>
        </aside>
      </div>
      <AnimatePresence>{cameraOpen && <CameraModal t={t} onClose={() => setCameraOpen(false)} onConfirm={selected => {
        if (selected.size > 10 * 1024 * 1024) { setFile(null); setCameraSelected(false); setError(t.fileSizeError) }
        else { setFile(selected); setCameraSelected(true); setError('') }
        setCameraOpen(false)
      }} />}</AnimatePresence>
    </section>
  )
}

async function decodeImage(file: File): Promise<void> {
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Image decode failed'))
      image.src = url
    })
  } finally { URL.revokeObjectURL(url) }
}

function CameraModal({ t, onClose, onConfirm }: { t: Translation; onClose: () => void; onConfirm: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [captured, setCaptured] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const start = async () => {
      try {
        streamRef.current?.getTracks().forEach(track => track.stop())
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
        if (!active) { stream.getTracks().forEach(track => track.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        setError('')
      } catch { if (active) setError(t.cameraDenied) }
    }
    void start()
    return () => { active = false; streamRef.current?.getTracks().forEach(track => track.stop()) }
  }, [facing, t.cameraDenied])

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) { setError(t.cameraDenied); return }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setCaptured(canvas.toDataURL('image/jpeg', 0.9))
  }
  const useCaptured = async () => {
    const response = await fetch(captured)
    const blob = await response.blob()
    onConfirm(new File([blob], `plantix-camera-${Date.now()}.jpg`, { type: 'image/jpeg' }))
  }

  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <motion.div className="camera-modal" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-labelledby="camera-heading">
      <div className="modal-head"><div><span className="section-kicker">{t.cameraBrand}</span><h2 id="camera-heading">{t.cameraTitle}</h2></div><button className="icon-button" onClick={onClose} aria-label={t.cancel}><X /></button></div>
      {captured ? <div className="camera-preview"><img src={captured} alt={t.selectedImage} /></div> : <div className="camera-preview"><video ref={videoRef} playsInline muted /><span className="camera-focus-frame" /></div>}
      <p className="camera-tip"><Sparkles size={15} />{t.cameraTip}</p>{error && <div className="inline-error"><CircleHelp size={17} />{error}</div>}
      <div className="modal-actions">
        {!captured ? <><button className="button button-quiet" onClick={onClose}>{t.cancel}</button><button className="button button-primary" onClick={capture}><span className="shutter-icon" />{t.capture}</button><button className="button button-outline camera-switch" onClick={() => setFacing(value => value === 'environment' ? 'user' : 'environment')}><Activity size={16} /><span>{t.switchCamera}</span></button></>
          : <><button className="button button-quiet" onClick={() => setCaptured('')}>{t.retake}</button><button className="button button-primary" onClick={() => void useCaptured()}><Check size={17} />{t.confirm}</button></>}
      </div>
    </motion.div>
  </motion.div>
}

function HistoryPage({ t, language }: { t: Translation; language: Language }) {
  const [reports, setReports] = useState<PlantReport[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [sort, setSort] = useState('newest')
  const [confirmDelete, setConfirmDelete] = useState<string | 'all' | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const reload = useCallback(async () => {
    try { setReports(await getReports()); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load scan history.') }
  }, [])
  useEffect(() => { void reload() }, [reload])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reports.filter(report => {
      const textMatch = `${displayPlant(report, t)} ${displayCondition(report, t)}`.toLowerCase().includes(query)
      const statusMatch = status === 'all' || (status === 'healthy' ? report.diagnosis.healthy : !report.diagnosis.healthy)
      const severityMatch = severity === 'all' || report.diagnosis.severity === severity
      const cutoff = dateRange === 'week' ? Date.now() - 7 * 86400000 : dateRange === 'month' ? Date.now() - 30 * 86400000 : 0
      const dateMatch = !cutoff || new Date(report.createdAt).getTime() >= cutoff
      return textMatch && statusMatch && severityMatch && dateMatch
    }).sort((a, b) => sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt)
      : sort === 'confidenceHigh' ? b.diagnosis.confidence - a.diagnosis.confidence
        : sort === 'confidenceLow' ? a.diagnosis.confidence - b.diagnosis.confidence : b.createdAt.localeCompare(a.createdAt))
  }, [reports, search, status, severity, dateRange, sort, t])

  const performDelete = async () => {
    try {
      if (confirmDelete === 'all') await clearReports()
      else if (confirmDelete) await deleteReport(confirmDelete)
      setConfirmDelete(null)
      await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete history.') }
  }
  const metrics = getMetrics(reports, language)
  return <section className="page-container history-page">
    <div className="page-heading history-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />{t.history}</div><h1>{t.historyTitle}</h1><p>{t.historyText}</p></div><Link to="/detect" className="button button-primary"><Leaf size={17} />{t.startScan}<ArrowRight size={16} /></Link></div>
    <section className="dashboard-panel">
      <div className="dashboard-heading"><div><span className="section-kicker">{t.garden}</span><h2>{t.dashboard}</h2></div><span className="dashboard-status"><i />{t.onDevice}</span></div>
      {reports.length ? <div className="dashboard-grid">
        <MetricCard icon={<Activity />} value={metrics.total} label={t.totalScans} tone="green" />
        <MetricCard icon={<HeartPulse />} value={metrics.healthy} label={t.healthyPlants} tone="mint" />
        <MetricCard icon={<Sprout />} value={metrics.diseased} label={t.attention} tone="amber" />
        <MetricCard icon={<BarChart3 />} value={metrics.topCondition === 'Early blight (demo sample)' ? t.demoCondition : metrics.topCondition} label={t.topCondition} tone="blue" />
        <div className="chart-card"><div><strong>{t.recentActivity}</strong><small>{t.savedByDay}</small></div><HistoryChart data={metrics.chart} label={t.chartAlt} />
        </div>
      </div> : <div className="dashboard-empty"><BarChart3 size={24} /><span>{t.noData}</span></div>}
    </section>
    <div className="history-toolbar"><div className="history-title"><div><span className="section-kicker">{t.savedOnDevice}</span><h2>{t.scanHistory} <span>{filtered.length}</span></h2></div>{reports.length > 0 && <button className="button button-danger-quiet" onClick={() => setConfirmDelete('all')}><Trash2 size={15} />{t.clearAll}</button>}</div>
      <div className="filters-row"><label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t.search} /></label>
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label={t.allResults}><option value="all">{t.allResults}</option><option value="healthy">{t.healthyFilter}</option><option value="disease">{t.diseaseFilter}</option></select>
        <select value={severity} onChange={event => setSeverity(event.target.value)} aria-label={t.allSeverity}><option value="all">{t.allSeverity}</option><option value="low">{t.low}</option><option value="moderate">{t.moderate}</option><option value="high">{t.high}</option></select>
        <select value={dateRange} onChange={event => setDateRange(event.target.value)} aria-label={t.dateFilter}><option value="all">{t.anyDate}</option><option value="week">{t.pastSevenDays}</option><option value="month">{t.pastThirtyDays}</option></select>
        <select value={sort} onChange={event => setSort(event.target.value)} aria-label={t.sortHistory}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option><option value="confidenceHigh">{t.highConfidence}</option><option value="confidenceLow">{t.lowConfidence}</option></select>
      </div>
    </div>
    {error && <div className="inline-error">{error}</div>}
    {filtered.length ? <div className="history-list">{filtered.map(report => <HistoryCard key={report.id} report={report} t={t} language={language} onView={() => navigate(`/report/${report.id}`)} onDelete={() => setConfirmDelete(report.id)} />)}</div> :
      <div className="empty-state"><div className="empty-illustration">🌿</div><h3>{reports.length ? t.noMatching : t.emptyHistory}</h3><p>{reports.length ? t.adjustFilters : t.emptyHistoryText}</p>{!reports.length && <Link to="/detect" className="button button-primary">{t.startScan}<ArrowRight size={16} /></Link>}</div>}
    <AnimatePresence>{confirmDelete && <ConfirmModal t={t} message={confirmDelete === 'all' ? t.clearConfirm : t.deleteConfirm} confirmLabel={confirmDelete === 'all' ? t.deleteAll : t.delete} onCancel={() => setConfirmDelete(null)} onConfirm={() => void performDelete()} />}</AnimatePresence>
  </section>
}

function getMetrics(reports: PlantReport[], language: Language) {
  const diseases = reports.filter(report => !report.diagnosis.healthy)
  const conditionCounts = diseases.reduce<Record<string, number>>((counts, report) => { counts[report.diagnosis.name] = (counts[report.diagnosis.name] ?? 0) + 1; return counts }, {})
  const topCondition = Object.entries(conditionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const day = date.toLocaleDateString(localeFor(language), { weekday: 'short' })
    const key = date.toDateString()
    return { day, scans: reports.filter(report => new Date(report.createdAt).toDateString() === key).length }
  })
  return { total: reports.length, healthy: reports.length - diseases.length, diseased: diseases.length, topCondition, chart: days }
}

function HistoryChart({ data, label }: { data: { day: string; scans: number }[]; label: string }) {
  const maximum = Math.max(1, ...data.map(item => item.scans))
  const points = data.map((item, index) => ({
    ...item,
    x: 8 + index * 284 / Math.max(1, data.length - 1),
    y: 88 - item.scans / maximum * 67,
  }))
  const line = points.map(point => `${point.x},${point.y}`).join(' ')
  const fill = `8,94 ${line} 292,94`
  return <div className="chart-area">
    <svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label={label}>
      <defs><linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#49a86b" stopOpacity=".27" /><stop offset="100%" stopColor="#49a86b" stopOpacity="0" /></linearGradient></defs>
      {[21, 54, 88].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#edf0e7" strokeWidth="1" />)}
      <polygon points={fill} fill="url(#scanFill)" />
      <polyline points={line} fill="none" stroke="#429666" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(point => <circle key={point.day} cx={point.x} cy={point.y} r="2.6" fill="#fff" stroke="#429666" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
    </svg>
    <div className="chart-labels">{points.map(point => <span key={point.day}>{point.day}</span>)}</div>
  </div>
}

function MetricCard({ icon, value, label, tone }: { icon: ReactNode; value: string | number; label: string; tone: string }) {
  return <div className={`metric-card metric-${tone}`}><span className="metric-icon">{icon}</span><strong title={String(value)}>{value}</strong><small>{label}</small></div>
}

function HistoryCard({ report, t, language, onView, onDelete }: { report: PlantReport; t: Translation; language: Language; onView: () => void; onDelete: () => void }) {
  const date = new Date(report.createdAt)
  return <article className="history-card"><img className="history-thumb" src={report.image} alt="" /><div className="history-card-content"><div className="history-card-title"><h3>{displayPlant(report, t)}</h3><span className={`status-pill ${report.diagnosis.healthy ? 'status-healthy' : 'status-disease'}`}>{report.diagnosis.healthy ? t.healthy : t.disease}</span></div><p>{displayCondition(report, t)}</p><div className="history-card-meta"><span><Sparkles size={13} />{t.confidence}: {Math.round(report.diagnosis.confidence * 100)}%</span><span><Clock3 size={13} />{date.toLocaleDateString(localeFor(language))} · {date.toLocaleTimeString(localeFor(language), { hour: '2-digit', minute: '2-digit' })}</span>{report.provider === 'demo' && <span className="demo-chip">DEMO</span>}</div></div><span className={`severity-pill severity-${report.diagnosis.severity}`}>{t[report.diagnosis.severity]}</span><div className="history-card-actions"><button className="button button-outline" onClick={onView}>{t.viewReport}<ArrowRight size={14} /></button><button className="icon-button delete-icon" onClick={onDelete} aria-label={t.delete}><Trash2 size={17} /></button></div></article>
}

function ConfirmModal({ t, message, confirmLabel, onCancel, onConfirm }: { t: Translation; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="confirm-modal" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} role="dialog" aria-modal="true"><div className="confirm-icon"><Trash2 /></div><h2>{confirmLabel}?</h2><p>{message}</p><div className="modal-actions"><button className="button button-quiet" onClick={onCancel}>{t.cancel}</button><button className="button button-danger" onClick={onConfirm}>{confirmLabel}</button></div></motion.div></motion.div>
}

function ReportPage({ t, language, flash }: { t: Translation; language: Language; flash: (message: string) => void }) {
  const { id } = useParams()
  const [report, setReport] = useState<PlantReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    getReports().then(reports => { if (active) setReport(reports.find(item => item.id === id) ?? null) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this report.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  const downloadPdf = async () => {
    if (!report) return
    try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    const margin = 18
    let y = 20
    pdf.setFillColor(32, 100, 66); pdf.roundedRect(margin, y, 174, 22, 3, 3, 'F')
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); pdf.text('PLANTIX', margin + 7, y + 9)
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text(t.reportTitle, margin + 7, y + 16)
    y += 32
    pdf.addImage(report.image, 'JPEG', margin, y, 52, 40); y += 48
    const line = (label: string, value: string) => {
      pdf.setTextColor(37, 70, 49); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(label, margin, y)
      pdf.setTextColor(72, 81, 72); pdf.setFont('helvetica', 'normal')
      const wrapped = pdf.splitTextToSize(value, 130)
      pdf.text(wrapped, margin + 48, y)
      y += Math.max(7, wrapped.length * 5)
      if (y > 265) { pdf.addPage(); y = 20 }
    }
    line(t.plantInfo, displayPlant(report, t))
    line(t.diseaseInfo, displayCondition(report, t))
    line(t.confidence, `${Math.round(report.diagnosis.confidence * 100)}%`)
    line(t.severity, t[report.diagnosis.severity])
    line(t.dateTime, new Date(report.createdAt).toLocaleString(localeFor(language)))
    line(t.symptoms, [...report.symptoms.observed, ...displayList(report, 'symptoms', t)].join('; ') || t.noVisualSigns)
    line(t.care, displayList(report, 'care', t).join('; '))
    line(t.nutrition, displayList(report, 'nutrition', t).join('; '))
    line('PLANTIX', t.disclaimer)
    if (report.provider === 'demo') line(t.demoNotice, t.notDiagnosed)
    pdf.save(`plantix-report-${report.id.slice(0, 8)}.pdf`)
    flash(t.pdfDownloaded)
    } catch (cause) {
      flash(cause instanceof Error ? cause.message : t.loadingError)
    }
  }
  const ask = (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() || !report) return
    const normalizedQuestion = question.toLocaleLowerCase()
    const answerKey: TranslationKey = /soil|மண்|మట్టి|मिट्टी|ಮಣ್ಣು|مٹی/.test(normalizedQuestion) ? 'answerSoil'
      : /prevent|prevention|avoid|रोक|தடு|ತಡೆ|నివా|بچاؤ/.test(normalizedQuestion) ? 'answerPrevent'
        : /weather|environment|வானிலை|వాతావరణ|ಹವಾಮಾನ|موسم/.test(normalizedQuestion) ? 'answerEnvironment'
          : /monitor|watch|check|கவனி|గమనించ|देखते|ನೋಡಿ|دیکھ/.test(normalizedQuestion) ? 'answerMonitor'
            : 'assistantAnswer'
    setAnswer(t[answerKey].replace('{plant}', displayPlant(report, t)).replace('{condition}', displayCondition(report, t)))
    setQuestion('')
  }
  if (loading) return <div className="page-container loading-page"><span className="scan-spinner" />{t.scanning}</div>
  if (!report) return <div className="page-container empty-state"><div className="empty-illustration">🌱</div><h2>{error || t.reportMissing}</h2><Link className="button button-primary" to="/history">{t.backHistory}</Link></div>
  const percent = Math.round(report.diagnosis.confidence * 100)
  return <section className="page-container report-page">
    <div className="report-top-actions"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17} />{t.backHistory}</button><button className="button button-outline" onClick={downloadPdf}><Download size={17} />{t.download}</button></div>
    {report.provider === 'demo' && <div className="demo-banner"><Sparkles size={17} /><div><strong>{t.demoNotice}</strong><span>{t.notDiagnosed}</span></div></div>}
    <div className="report-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />{t.reportTitle.toUpperCase()}</div><h1>{displayPlant(report, t)}</h1><p>{displayCondition(report, t)} <span className="heading-dot">·</span> {new Date(report.createdAt).toLocaleString(localeFor(language))}</p></div><span className={`status-pill status-large ${report.diagnosis.healthy ? 'status-healthy' : 'status-disease'}`}>{report.diagnosis.healthy ? t.healthy : t.disease}</span></div>
    <div className="report-grid">
      <article className="report-image-card"><img src={report.image} alt={`${displayPlant(report, t)} leaf`} /><div className="report-image-caption"><FileImage size={15} />{report.filename}</div></article>
      <article className="confidence-card"><div className="card-label"><Sparkles size={17} />{t.confidence}</div><div className="confidence-gauge" style={{ '--confidence': `${percent}%` } as CSSProperties}><div><strong>{percent}%</strong><span>{t.estimated}</span></div></div><p>{t.confidenceNote}</p></article>
      <article className="detail-card plant-detail"><div className="detail-card-heading"><span className="detail-icon green-icon"><Sprout /></span><div><span className="section-kicker">{t.plantInfo}</span><h2>{displayPlant(report, t)}</h2></div></div><dl><InfoRow label={t.scientificName} value={report.plant.scientific_name || '—'} /><InfoRow label={t.category} value={report.plant.category || '—'} /><InfoRow label={t.growthStage} value={report.plant.growth_stage || t.notAssessed} /><InfoRow label={t.confidence} value={`${Math.round(report.plant.confidence * 100)}%`} /></dl></article>
      <article className="detail-card diagnosis-detail"><div className="detail-card-heading"><span className="detail-icon amber-icon"><HeartPulse /></span><div><span className="section-kicker">{t.diseaseInfo}</span><h2>{displayCondition(report, t)}</h2></div></div><p>{report.provider === 'demo' ? t.notDiagnosed : report.diagnosis.explanation}</p><div className="severity-row"><span>{t.severity}</span><span className={`severity-pill severity-${report.diagnosis.severity}`}>{t[report.diagnosis.severity]}</span></div><p className="small-disclaimer">{t.reportWarning}</p></article>
      <article className="detail-card full-detail symptoms-detail"><div className="detail-card-heading"><span className="detail-icon purple-icon"><Search /></span><div><span className="section-kicker">{t.symptoms}</span><h2>{t.observed}</h2></div></div>{report.symptoms.observed.length ? <TagList items={report.symptoms.observed} /> : <p className="muted-copy">{t.noVisualSigns}</p>}<div className="subsection-heading">{t.associated}</div><TagList items={displayList(report, 'symptoms', t)} /></article>
      {report.diagnosis.healthy && <article className="detail-card full-detail healthy-care"><div className="detail-card-heading"><span className="detail-icon green-icon"><Check /></span><div><span className="section-kicker">{t.healthySigns}</span><h2>{t.maintainHealth}</h2></div></div><TagList items={[t.uniformLeaves, t.noLesions, t.monitorPlant]} /><button className="button button-outline" onClick={() => flash(t.continueMonitor)}>{t.continueMonitor}<ArrowRight size={15} /></button></article>}
      <GuidanceCard t={t} icon={<Flower2 />} title={t.care} list={displayList(report, 'care', t)} tone="green-icon" />
      <GuidanceCard t={t} nutrition icon={<Sprout />} title={t.nutrition} list={displayList(report, 'nutrition', t)} tone="amber-icon" note={t.nutritionNote} />
      <GuidanceCard t={t} icon={<ShieldCheck />} title={t.prevention} list={displayList(report, 'prevention', t)} tone="blue-icon" />
      <article className="detail-card full-detail ask-card"><div className="detail-card-heading"><span className="detail-icon purple-icon"><Sparkles /></span><div><span className="section-kicker">{t.supportKicker}</span><h2>{t.askTitle}</h2><p>{t.askText}</p></div></div><form className="ask-form" onSubmit={ask}><input value={question} onChange={event => setQuestion(event.target.value)} placeholder={t.askPlaceholder} maxLength={400} /><button type="submit" className="button button-primary" disabled={!question.trim()}>{t.ask}<ArrowRight size={15} /></button></form>{answer && <div className="assistant-answer"><Sparkles size={16} /><p>{answer}</p></div>}<p className="small-disclaimer">{t.assistantMode}</p><p className="small-disclaimer">{t.askSafety}</p></article>
      <div className="report-disclaimer"><ShieldCheck size={19} /><p>{t.disclaimer}</p></div>
    </div>
    <div className="report-bottom-actions"><Link to="/detect" className="button button-primary"><Leaf size={17} />{t.backDetect}<ArrowRight size={16} /></Link><Link to="/history" className="button button-quiet">{t.backHistory}</Link></div>
  </section>
}

function InfoRow({ label, value }: { label: string; value: string }) { return <div className="info-row"><dt>{label}</dt><dd>{value}</dd></div> }
function TagList({ items }: { items: string[] }) { return <div className="tag-list">{items.map((item, index) => <span key={`${item}-${index}`}><Check size={13} />{item}</span>)}</div> }
function GuidanceCard({ t, icon, title, list, tone, note, nutrition = false }: { t: Translation; icon: ReactNode; title: string; list: string[]; tone: string; note?: string; nutrition?: boolean }) {
  return <article className="detail-card guidance-card"><div className="detail-card-heading"><span className={`detail-icon ${tone}`}>{icon}</span><div><span className="section-kicker">{t.guidanceLabel}</span><h2>{title}</h2></div></div><ul>{list.map((item, index) => <li key={`${item}-${index}`}><Check size={15} />{item}</li>)}</ul>{nutrition && <><div className="nutrient-mini"><span>N<small>{t.nitrogen}</small></span><span>P<small>{t.phosphorus}</small></span><span>K<small>{t.potassium}</small></span></div><p className="small-disclaimer">{t.organic}</p></>}{note && <p className="small-disclaimer">{note}</p>}</article>
}

function About({ t }: { t: Translation }) {
  return <section className="page-container about-page">
    <div className="about-hero"><div className="eyebrow"><span className="eyebrow-dot" />{t.aboutKicker}</div><h1>{t.aboutTitle}</h1><p>{t.aboutText}</p><div className="about-illustration" aria-hidden="true"><span className="about-sun" /><span className="about-leaf leaf-a">🍃</span><span className="about-leaf leaf-b">🌱</span><span className="about-leaf leaf-c">🌿</span></div></div>
    <div className="about-content"><div className="about-section"><span className="section-kicker">{t.aboutHow}</span><h2>{t.howTitle}</h2><div className="about-steps">{([t.stepCapture, t.stepAnalyze, t.stepIdentify, t.stepLearn, t.stepImprove] as string[]).map((title, i) => <div key={title} className="about-step"><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{title}</strong><p>{[t.stepCaptureText, t.stepAnalyzeText, t.stepIdentifyText, t.stepLearnText, t.stepImproveText][i]}</p></div></div>)}</div></div>
      <div className="technology-card"><span className="technology-icon"><Microscope /></span><h3>{t.technology}</h3><p>{t.technologyText}</p><span className="demo-chip">{t.demoIncluded}</span></div>
      <div className="safety-card"><ShieldCheck /><p>{t.confidenceNote}</p></div>
    </div>
  </section>
}

function Settings({ t, language, setLanguage }: { t: Translation; language: Language; setLanguage: (language: Language) => void }) {
  return <section className="page-container settings-page"><div className="page-heading"><div className="eyebrow"><span className="eyebrow-dot" />PLANTIX</div><h1>{t.settingsTitle}</h1></div><div className="settings-card"><div className="settings-icon"><Globe2 /></div><div><h2>{t.languageSetting}</h2><p>{t.settingsHelp}</p></div><select value={language} onChange={event => setLanguage(event.target.value as Language)} aria-label={t.languageSetting}>{languageOptions.map(option => <option key={option.code} value={option.code}>{option.native} · {option.label}</option>)}</select></div><div className="settings-card"><div className="settings-icon"><ShieldCheck /></div><div><h2>{t.privateStorage}</h2><p>{t.storageSetting}</p></div></div><div className="settings-card"><div className="settings-icon"><Activity /></div><div><h2>{t.providerName}</h2><p>{t.providerHelp}</p><span className="demo-chip">{t.demoIncluded}</span></div></div></section>
}

function NotFound({ t }: { t: Translation }) {
  return <section className="page-container not-found"><div className="not-found-art">🌱</div><span className="section-kicker">{t.fieldNotFound}</span><h1>{t.notFound}</h1><Link to="/" className="button button-primary">{t.backHome}<ArrowRight size={16} /></Link></section>
}

function Footer({ t }: { t: Translation }) {
  return <footer className="site-footer"><div className="footer-inner"><Link to="/" className="logo-link"><Logo /></Link><span>{t.footerNote}</span><div className="footer-links"><Link to="/about">{t.about}</Link><Link to="/settings">{t.settings}</Link><span>© {new Date().getFullYear()} PLANTIX</span></div></div><div className="footer-disclaimer">{t.disclaimerShort}</div></footer>
}

export default App
