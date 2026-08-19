import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdaylar,
  getTakimlar,
  createTakim,
  deleteTakim,
  getKatilimcilar,
  getGorevler,
  getMentorlar,
  getTeslimler,
  createGorev,
  activateProgramGorev,
  updateGorevMaterial,
  uploadProgramMaterialFile,
  deleteGorev,
  updateKatilimci,
  updateTakim,
  callAdminAction,
  getAdminPerformansList,
  getAdminKatilimciToplantilari,
  getAdminKatilimciSosyalMedya,
  getAdminKatilimciTeslimleri,
  getAdminIcerikDnaList,
  updateAdminPerformansScore,
  addAdminToplantiKatilimi,
  deleteAdminToplantiKatilimi,
  addAdminSosyalMedya,
  deleteAdminSosyalMedya,
  importCandidatesCsvText,
  getAdminKatilimciDetay,
  getAdminKatilimciAktiviteLoglari,
  getDriveThumbnailUrl,
  getParticipantAvatarSrc,
  resendAllParticipantInvitations,
  resendSingleParticipantInvitation,
  getProgramHaftalariAdmin,
  updateProgramHafta,
  passivateParticipant,
  activateParticipant,
  logoutUser
} from '../services/supabaseService'
import { PROGRAM_TASKS, PROGRAM_WEEKS } from '../data/programSchedule'
import DnaReportRenderer from '../components/DnaReportRenderer'

const DURUM_MAP = {
  ONAYLANDI:  { label: 'Onaylandı',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  BEKLIYOR:   { label: 'Bekliyor',   cls: 'bg-amber-100  text-amber-700  border-amber-200',    dot: 'bg-amber-400'   },
  REDDEDILDI: { label: 'Reddedildi', cls: 'bg-red-100    text-red-600    border-red-200',      dot: 'bg-red-500'     },
}

/* ════════════════════════════════════════
   SVG İKONLAR
════════════════════════════════════════ */
const Ic = {
  Users:     ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" /></svg>,
  MentorIcon: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.722.515 12.74 12.74 0 01.635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 01-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 01.722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08z" clipRule="evenodd" /></svg>,
  Team:      ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" /><path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" /></svg>,
  Task:      ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" /><path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" /></svg>,
  Calendar:  ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" /></svg>,
  Dashboard: ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" /></svg>,
  Logout:    ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>,
  Check:     ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>,
  X:         ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>,
  Eye:       ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" /></svg>,
  Refresh:   ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" /></svg>,
  Search:    ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" /></svg>,
  Close:     ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>,
  Star:      ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>,
  Plus:      ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>,
  UserPlus:  ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" /></svg>,
  Pencil:    ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>,
  Trash:     ({ c = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={c}><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>,
  Sparkles:  ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={c}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
  Dna:       ({ c = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M7 3c5 3 5 15 10 18" /><path d="M17 3C12 6 12 18 7 21" /><path d="M9 6h6" /><path d="M8.5 10h7" /><path d="M8.5 14h7" /><path d="M9 18h6" /></svg>,
}

/* ════════════════════════════════════════
   YARDIMCI BİLEŞENLER
════════════════════════════════════════ */

function StatusBadge({ apiDurum }) {
  const d = DURUM_MAP[apiDurum] ?? { label: apiDurum ?? 'Bilinmiyor', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${d.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
      {d.label}
    </span>
  )
}

function StatCard({ icon, label, value, color, bg, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 group">
      <div className={`${bg} ${color} p-4 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        {loading ? <div className="h-8 w-14 bg-gray-200 rounded-lg animate-pulse mt-1" /> : <p className="text-3xl font-bold text-gray-800 mt-0.5 tabular-nums">{value}</p>}
      </div>
    </div>
  )
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${50 + (i * 13) % 40}%` }} /></td>
      ))}
    </tr>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-coral text-white shadow-md shadow-orange-200' : 'text-gray-500 hover:bg-orange-50 hover:text-coral'}`}>
      {icon}<span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
    </button>
  )
}

function Toast({ msg, type, onClose }) {
  const colors = { success: 'bg-emerald-50 border-emerald-200 text-emerald-700', error: 'bg-red-50 border-red-200 text-red-700', info: 'bg-blue-50 border-blue-200 text-blue-700' }
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg text-sm font-medium animate-slide-up ${colors[type] ?? colors.info}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><Ic.Close c="w-4 h-4" /></button>
    </div>
  )
}

function AdayModal({ aday, onClose, onDurumGuncelle, updating }) {
  if (!aday) return null
  const fields = [
    ['Ad Soyad',    aday.ad_soyad],
    ['E-posta',     aday.eposta],
    ['Telefon',     aday.telefon],
    ['Üniversite',  aday.universite],
    ['Sınıf',       aday.sinif],
    ['Sosyal Medya', aday.sosyal_medya],
    ['İçerik Deneyimi', aday.icerik_uretimi],
    ['Takvim Onayı', aday.takvim_onay ? '✅ Onayladı' : '❌ Onaylamadı'],
    ['Başvuru Tarihi', aday.basvuru_tarihi ? new Date(aday.basvuru_tarihi).toLocaleDateString('tr-TR') : '—'],
    ['Kaynak', aday.kaynak],
  ]

  const isUpd = updating === aday.id

  const handleKabul = () => {
    if (window.confirm('Bu adayı kabul etmek istediğinizden emin misiniz?')) {
      onDurumGuncelle(aday, 'ONAYLANDI')
    }
  }

  const handleReddet = () => {
    if (window.confirm('Bu adayı reddetmek istediğinizden emin misiniz?')) {
      onDurumGuncelle(aday, 'REDDEDILDI')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{aday.ad_soyad}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{aday.universite ?? '—'} · {aday.sinif ?? '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><Ic.Close /></button>
        </div>
        <div className="px-8 py-6 space-y-3">
          {fields.map(([k, v]) => (
            <div key={k} className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-36 flex-shrink-0 pt-0.5">{k}</span>
              <span className="text-sm text-gray-700 break-all">{v ?? '—'}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-36 flex-shrink-0">Durum</span>
            <StatusBadge apiDurum={aday.basvuru_durumu} />
          </div>

          {/* İnceleme Ekranı Kabul / Reddet Butonları */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              id={`btn-modal-reddet-${aday.id}`}
              disabled={isUpd || aday.basvuru_durumu === 'REDDEDILDI'}
              onClick={handleReddet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ic.X c="w-4 h-4" /> Adayı Reddet
            </button>
            <button
              id={`btn-modal-kabul-${aday.id}`}
              disabled={isUpd || aday.basvuru_durumu === 'ONAYLANDI'}
              onClick={handleKabul}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ic.Check c="w-4 h-4" /> Adayı Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Mentor Dropdown (v2) ─── */
function MentorDropdown({ takimId, currentMentorId, mentorlar, onSaved }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (e) => {
    const val = e.target.value
    if (saving) return
    setSaving(true)
    try {
      await updateTakim(takimId, { mentor_id: val === '' ? null : Number(val) })
      onSaved(val === '' ? null : Number(val))
    } catch (e) {
      alert(`Mentor güncellenemedi: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {saving && <span className="w-3 h-3 border-2 border-violet border-t-transparent rounded-full animate-spin flex-shrink-0" />}
      <select
        value={currentMentorId ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="text-xs border border-violet/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet/30 bg-white text-gray-600 max-w-[160px] disabled:opacity-60 transition-all hover:border-violet/60"
      >
        <option value="">— Atanmadı —</option>
        {mentorlar.map(m => (
          <option key={m.id} value={m.id}>{m.ad_soyad}</option>
        ))}
      </select>
    </div>
  )
}

/* ════════════════════════════════════════
   TESLİM TIMELINE BİLEŞENİ
════════════════════════════════════════ */
function TeslimTimeline({ hareketler }) {
  // DATA-WARN-01 cleanup: Drive webViewLink URLs start with https:// and pass through directly.
  // Legacy /media/ relative paths from Django are no longer supported; return null so UI hides the link.
  const resolveUrl = (url) => {
    if (!url || typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    // Relative /media/ path — no longer has a backend; suppress rather than emit broken localhost link
    return null
  }

  const safeList = Array.isArray(hareketler)
    ? hareketler
    : Array.isArray(hareketler?.results)
    ? hareketler.results
    : []

  if (safeList.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center text-[11px] text-gray-400 italic">
        Bu teslim için henüz işlem geçmişi bulunmuyor.
      </div>
    )
  }

  const sorted = [...safeList].sort((a, b) => {
    const tA = a?.tarih ? new Date(a.tarih).getTime() : 0
    const tB = b?.tarih ? new Date(b.tarih).getTime() : 0
    return tA - tB
  })

  const ISLEM_CONFIG = {
    ILK_TESLIM: { label: 'İlk Teslim', icon: '🚀', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    TESLIM_EDILDI: { label: 'Teslim edildi', icon: '🚀', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    REVIZYON_ISTENDI: { label: 'Revizyon istendi', icon: '🔄', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    REVIZE_TESLIM: { label: 'Revize Teslim', icon: '📤', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    NIHAI_DEGERLENDIRME: { label: 'Nihai değerlendirme', icon: '✅', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  return (
    <div className="relative pl-3 space-y-2.5 my-2 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200/80">
      {sorted.map((h, idx) => {
        if (!h || typeof h !== 'object') return null
        const tipe = String(h.islem_tipi || '').toUpperCase()
        const config = ISLEM_CONFIG[tipe] || {
          label: String(h.islem_tipi_etiketi || h.islem_tipi || 'İşlem'),
          icon: '📌',
          badge: 'bg-gray-50 text-gray-700 border-gray-200'
        }

        const tarihStr = h.tarih
          ? new Date(h.tarih).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—'
        const yapan = String(h.olusturan_adi || h.olusturan_user || 'Sistem')
        const dosyaUrl = resolveUrl(
          h.teslim_dosyasi_url ||
          h.drive_file_url ||
          h.file_url ||
          (typeof h.teslim_dosyasi === 'string' ? h.teslim_dosyasi : null)
        )
        const teslimLinki = h.teslim_linki && typeof h.teslim_linki === 'string' ? h.teslim_linki : null
        const aciklama = h.aciklama || h.revizyon_notu || h.not_metni
        const mentorYorumu = h.mentor_yorumu

        return (
          <div key={h.id || idx} className="relative flex items-start gap-2 text-xs">
            <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-2 ring-white" />
            <div className="bg-white border border-gray-100 rounded-xl p-3 w-full shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${config.badge}`}>
                    {config.icon} {config.label}
                  </span>
                  <span className="font-semibold text-slate-700">{yapan}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{tarihStr}</span>
              </div>

              {aciklama && (
                <p className="text-[11px] text-slate-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {String(aciklama)}
                </p>
              )}

              {mentorYorumu && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <strong>Mentor Yorumu:</strong> "{String(mentorYorumu)}"
                </p>
              )}

              {(typeof h.puan === 'number' || typeof h.puan === 'string') && h.puan !== null && (
                <div className="inline-block bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                  Puan: {h.puan}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 flex-wrap">
                {dosyaUrl ? (
                  <a
                    href={dosyaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-violet hover:underline flex items-center gap-1"
                  >
                    📎 Yüklenen Dosya
                  </a>
                ) : (
                  <span className="text-gray-400 italic text-[10px]">Dosya yok</span>
                )}

                {teslimLinki && (
                  <a
                    href={teslimLinki.startsWith('http') ? teslimLinki : `https://${teslimLinki}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    🔗 Dış Bağlantı
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════
   ANA BİLEŞEN
════════════════════════════════════════ */
export default function AdminPanel() {
  const navigate = useNavigate()

  /* ── State ── */
  const [menu, setMenu]                     = useState('adaylar')
  const [adaylar, setAdaylar]               = useState([])
  const [takimlar, setTakimlar]             = useState([])
  const [katilimcilar, setKatilimcilar]     = useState([])
  const [mentorlar, setMentorlar]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [search, setSearch]                 = useState('')
  const [updating, setUpdating]             = useState(null)
  const [toast, setToast]                   = useState(null)
  const [modal, setModal]                   = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [addingMember, setAddingMember]     = useState(null)
  // Yeni takım formu
  const [yeniTakimAdi, setYeniTakimAdi]     = useState('')
  const [creatingTakim, setCreatingTakim]   = useState(false)
  // Takım silme
  const [deletingTakim, setDeletingTakim]   = useState(null)
  // Görevler
  const [gorevler, setGorevler]             = useState([])
  const [teslimler, setTeslimler]           = useState([])
  const [gorevModal, setGorevModal]         = useState(false)
  const [savingGorev, setSavingGorev]       = useState(false)
  const [deletingGorev, setDeletingGorev]   = useState(null)
  const [activatingProgramTaskKey, setActivatingProgramTaskKey] = useState(null)
  const [programTaskScores, setProgramTaskScores] = useState({
    'week1-antibiyotik-cift-versiyon': '100',
    'week2-hook-ai-senaryo': '100',
    'week3-who-sandvic-final': '150'
  })
  const [materialForms, setMaterialForms] = useState({})
  const [savingMaterialId, setSavingMaterialId] = useState(null)
  const GOREV_BOSH = { hafta: '', gorev_adi: '', brief_aciklama: '', puan_kriterleri: '', son_teslim_tarihi: '', maksimum_puan: 100, gorev_tipi: 'GENEL', hedef_katilimci: '', hedef_takim: '' }
  const [gorevForm, setGorevForm]           = useState(GOREV_BOSH)
  // Mentor Sekmesi
  const MENTOR_BOSH = { ad_soyad: '', eposta: '', uzmanlik: '', gecici_sifre: '' }
  const [mentorForm, setMentorForm]         = useState(MENTOR_BOSH)
  const [savingMentor, setSavingMentor]     = useState(false)
  const [deletingMentor, setDeletingMentor] = useState(null)
  const [showMentorForm, setShowMentorForm] = useState(false)

  // İçerik DNA Testi
  const [dnaList, setDnaList]         = useState([])
  const [dnaLoading, setDnaLoading]   = useState(false)
  const [dnaError, setDnaError]       = useState(null)
  const [dnaDetail, setDnaDetail]     = useState(null)   // seçili kayıt detayı
  const [dnaRegen, setDnaRegen]       = useState(null)   // regenerate loading id

  // İçe Aktar Modal
  const [importModal, setImportModal]   = useState(false)   // 'csv' | 'url' | false
  const [importTab, setImportTab]       = useState('csv')   // 'csv' | 'url'
  const [importFile, setImportFile]     = useState(null)
  const [importUrl, setImportUrl]       = useState('')
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)    // sonuç objesi

  // 48h Davet / Şifre Maili Gönderim State
  const [sendingInvites, setSendingInvites]           = useState(false)
  const [sendingSingleInvite, setSendingSingleInvite] = useState(null)

  // Haftalık Program (Canlı Eğitimler & Zoom) State
  const [programHaftalari, setProgramHaftalari]       = useState([])
  const [savingHaftaNo, setSavingHaftaNo]             = useState(null)
  const [haftaEdits, setHaftaEdits]                   = useState({})

  const handleHaftaFieldChange = (haftaNo, field, value) => {
    setHaftaEdits(prev => ({
      ...prev,
      [haftaNo]: {
        ...(prev[haftaNo] || {}),
        [field]: value
      }
    }))
  }

  const handleToggleHaftaAktif = async (haftaObj) => {
    const haftaNo = haftaObj.hafta
    const newAktif = !haftaObj.aktif
    setSavingHaftaNo(haftaNo)
    try {
      await updateProgramHafta(haftaNo, { aktif: newAktif })
      setProgramHaftalari(prev => prev.map(h => h.hafta === haftaNo ? { ...h, aktif: newAktif } : h))
      setToast({
        msg: `${haftaNo}. Hafta ${newAktif ? 'katılımcılara açıldı (Aktif edildi) 🟢' : 'katılımcılara kapatıldı (Pasif yapıldı) 🔒'}`,
        type: newAktif ? 'success' : 'info'
      })
    } catch (e) {
      setToast({ msg: `Hafta durumu güncellenemedi: ${e.message}`, type: 'error' })
    } finally {
      setSavingHaftaNo(null)
    }
  }

  const handleToggleGunAktif = async (haftaObj, gunKey) => {
    const haftaNo = haftaObj.hafta
    const newVal = haftaObj[gunKey] === false ? true : false
    setSavingHaftaNo(haftaNo)
    try {
      await updateProgramHafta(haftaNo, { [gunKey]: newVal })
      setProgramHaftalari(prev => prev.map(h => h.hafta === haftaNo ? { ...h, [gunKey]: newVal } : h))
      const gunAd = gunKey.includes('sali') ? 'Salı' : 'Perşembe'
      setToast({
        msg: `${haftaNo}. Hafta ${gunAd} canlı eğitimi ${newVal ? 'aktif edildi' : 'pasif yapıldı'}`,
        type: 'success'
      })
    } catch (e) {
      setToast({ msg: `Gün durumu güncellenemedi: ${e.message}`, type: 'error' })
    } finally {
      setSavingHaftaNo(null)
    }
  }

  const handleSaveHaftaDetails = async (haftaObj) => {
    const haftaNo = haftaObj.hafta
    const edits = haftaEdits[haftaNo] || {}
    setSavingHaftaNo(haftaNo)
    try {
      const payload = {
        baslik: edits.baslik !== undefined ? edits.baslik : haftaObj.baslik,
        hedef: edits.hedef !== undefined ? edits.hedef : haftaObj.hedef,
        sali_zoom_url: edits.sali_zoom_url !== undefined ? edits.sali_zoom_url : haftaObj.sali_zoom_url,
        sali_calendar_url: edits.sali_calendar_url !== undefined ? edits.sali_calendar_url : haftaObj.sali_calendar_url,
        sali_meeting_id: edits.sali_meeting_id !== undefined ? edits.sali_meeting_id : haftaObj.sali_meeting_id,
        sali_passcode: edits.sali_passcode !== undefined ? edits.sali_passcode : haftaObj.sali_passcode,
        persembe_zoom_url: edits.persembe_zoom_url !== undefined ? edits.persembe_zoom_url : haftaObj.persembe_zoom_url,
        persembe_calendar_url: edits.persembe_calendar_url !== undefined ? edits.persembe_calendar_url : haftaObj.persembe_calendar_url,
        persembe_meeting_id: edits.persembe_meeting_id !== undefined ? edits.persembe_meeting_id : haftaObj.persembe_meeting_id,
        persembe_passcode: edits.persembe_passcode !== undefined ? edits.persembe_passcode : haftaObj.persembe_passcode,
      }
      await updateProgramHafta(haftaNo, payload)
      setProgramHaftalari(prev => prev.map(h => h.hafta === haftaNo ? { ...h, ...payload } : h))
      setHaftaEdits(prev => {
        const next = { ...prev }
        delete next[haftaNo]
        return next
      })
      setToast({ msg: `${haftaNo}. Hafta canlı eğitim bilgileri ve Zoom linkleri kaydedildi! ✅`, type: 'success' })
    } catch (e) {
      setToast({ msg: `Kayıt başarısız: ${e.message}`, type: 'error' })
    } finally {
      setSavingHaftaNo(null)
    }
  }

  const handleResendAllInvitations = async () => {
    if (!window.confirm('Tüm aktif katılımcılara 48 saat geçerli şifre belirleme davet e-postalarını yeniden göndermek istiyor musunuz?')) return
    setSendingInvites(true)
    try {
      const res = await resendAllParticipantInvitations()
      if (res?.ok && res.data) {
        setToast({
          msg: `${res.data.sent} katılımcıya 48 saatlik şifre belirleme e-postası başarıyla iletildi. (${res.data.failed} başarısız)`,
          type: res.data.failed > 0 ? 'warning' : 'success'
        })
      }
    } catch (e) {
      setToast({ msg: `E-posta gönderim hatası: ${e.message}`, type: 'error' })
    } finally {
      setSendingInvites(false)
    }
  }

  const handleResendSingleInvitation = async (email, adSoyad) => {
    if (!email) {
      setToast({ msg: 'Adayın geçerli bir e-posta adresi bulunmuyor.', type: 'error' })
      return
    }
    setSendingSingleInvite(email)
    try {
      const res = await resendSingleParticipantInvitation(email)
      if (res?.ok) {
        setToast({ msg: `${adSoyad || email} adresine 48 saat geçerli şifre bağlantısı gönderildi.`, type: 'success' })
      }
    } catch (e) {
      setToast({ msg: `E-posta gönderim hatası: ${e.message}`, type: 'error' })
    } finally {
      setSendingSingleInvite(null)
    }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [aD, tD, kD, gD, mD, tesD, pHD] = await Promise.all([
        getAdaylar(),
        getTakimlar(),
        getKatilimcilar(),
        getGorevler(),
        getMentorlar(),
        getTeslimler(),
        getProgramHaftalariAdmin().catch(() => []),
      ])
      setAdaylar(aD)
      setTakimlar(tD)
      setKatilimcilar(kD)
      setGorevler(gD)
      setMentorlar(mD)
      setTeslimler(tesD)
      setProgramHaftalari(pHD || [])
    } catch (e) {
      console.error('Supabase fetchAll error:', e)
      setError(e.message || 'Veriler yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ── Toast otomatik kapat ── */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  /* ── Aday durum güncelle (admin-actions Edge Function) ── */
  const durumGuncelle = async (aday, yeniDurum, forceRevert = false) => {
    if (updating) return
    setUpdating(aday.id)
    try {
      const action = yeniDurum === 'ONAYLANDI' ? 'approve_candidate' : 'reject_candidate'
      const payload = { aday_id: aday.id }
      if (yeniDurum === 'REDDEDILDI' && forceRevert) {
        payload.force_revert_participant = true
      }
      
      const res = await callAdminAction(action, payload)
      
      setAdaylar(prev => prev.map(a => a.id === aday.id ? { ...a, basvuru_durumu: yeniDurum } : a))
      setModal(prev => (prev && prev.id === aday.id) ? { ...prev, basvuru_durumu: yeniDurum } : prev)
      
      // Her iki durumda da katılımcı listesini güncelle
      const kD = await getKatilimcilar()
      setKatilimcilar(kD)

      const successMsg = res?.revertedParticipant 
        ? `"${aday.ad_soyad}" reddedildi ve katılımcı bağlantısı geri alındı.`
        : `"${aday.ad_soyad}" → ${DURUM_MAP[yeniDurum]?.label ?? yeniDurum}`

      setToast({ msg: successMsg, type: 'success' })
    } catch (e) {
      const errText = e?.message || String(e)
      if (yeniDurum === 'REDDEDILDI' && !forceRevert && (errText.includes('katılımcıya dönüştürülmüş') || errText.includes('onayı gerekir') || errText.includes('geri alma'))) {
        setUpdating(null)
        const confirmed = window.confirm(
          `"${aday.ad_soyad}" daha önce katılımcıya dönüştürülmüş.\n\nReddetmek için katılımcı kaydı geri alınacak, ilgili teslim/DNA/test kayıtları temizlenecektir. Auth hesabı silinmeyecektir.\n\nDevam etmek istiyor musunuz?`
        )
        if (confirmed) {
          return durumGuncelle(aday, 'REDDEDILDI', true)
        }
        return
      }
      setToast({ msg: `Güncelleme başarısız: ${errText}`, type: 'error' })
    }
    finally { setUpdating(null) }
  }

  /* ── Takım oluştur (Supabase Client) ── */
  const takimOlustur = async () => {
    if (!yeniTakimAdi.trim() || creatingTakim) return
    setCreatingTakim(true)
    try {
      await createTakim({ takim_adi: yeniTakimAdi.trim() })
      setYeniTakimAdi('')
      await fetchAll()
      setToast({ msg: `"${yeniTakimAdi.trim()}" takımı oluşturuldu!`, type: 'success' })
    } catch (e) { setToast({ msg: `Takım oluşturulamadı: ${e.message}`, type: 'error' }) }
    finally { setCreatingTakim(false) }
  }

  /* ── Takım sil (Supabase Client) ── */
  const takimSil = async (takim) => {
    setDeletingTakim(takim.id)
    try {
      await deleteTakim(takim.id)
      await fetchAll()
      setToast({ msg: `"${takim.takim_adi}" takımı silindi, bağlı katılımcılar takımsız hale getirildi.`, type: 'info' })
    } catch (e) { setToast({ msg: `Takım silinemedi: ${e.message}`, type: 'error' }) }
    finally { setDeletingTakim(null) }
  }

  /* ── Mentor ata: MentorDropdown tarafından çağrılır ── */
  const mentorGuncelle = (takimId, yeniMentorId) => {
    setTakimlar(prev => prev.map(t => t.id === takimId ? { ...t, mentor: yeniMentorId } : t))
    setToast({ msg: 'Mentor atandı!', type: 'success' })
  }

  /* ── Mentor oluştur (admin-actions Edge Function) ── */
  const mentorOlustur = async () => {
    const { ad_soyad, eposta, uzmanlik, gecici_sifre } = mentorForm
    if (!ad_soyad.trim() || !eposta.trim()) {
      setToast({ msg: 'Ad Soyad ve E-posta zorunludur.', type: 'error' })
      return
    }
    setSavingMentor(true)
    try {
      await callAdminAction('create_mentor', {
        ad_soyad: ad_soyad.trim(),
        eposta: eposta.trim(),
        uzmanlik: uzmanlik.trim(),
        gecici_sifre: gecici_sifre ? gecici_sifre.trim() : '',
      })
      setMentorForm(MENTOR_BOSH)
      setShowMentorForm(false)
      await fetchAll()
      setToast({ msg: `"${ad_soyad.trim()}" mentor olarak eklendi! 🎉`, type: 'success' })
    } catch (e) { setToast({ msg: `Mentor eklenemedi: ${e.message}`, type: 'error' }) }
    finally { setSavingMentor(false) }
  }

  /* ── Mentor sil (admin-actions Edge Function) ── */
  const mentorSil = async (mentor) => {
    setDeletingMentor(mentor.id)
    try {
      await callAdminAction('delete_mentor', { mentor_id: mentor.id })
      await fetchAll()
      setToast({ msg: `"${mentor.ad_soyad}" pasif hale getirildi.`, type: 'info' })
    } catch (e) { setToast({ msg: `Mentor silinemedi: ${e.message}`, type: 'error' }) }
    finally { setDeletingMentor(null) }
  }

  /* ── Üye ekle (Supabase Client) ── */
  const uyeEkle = async (takimId, katilimciId) => {
    setAddingMember(takimId)
    setActiveDropdown(null)
    try {
      await updateKatilimci(katilimciId, { takim_id: takimId })
      await fetchAll()
      setToast({ msg: 'Katılımcı takıma eklendi.', type: 'success' })
    } catch (e) { setToast({ msg: `Üye eklenemedi: ${e.message}`, type: 'error' }) }
    finally { setAddingMember(null) }
  }

  /* ── Üye çıkar (Supabase Client) ── */
  const uyeCikar = async (katilimciId, uyeAdi) => {
    try {
      await updateKatilimci(katilimciId, { takim_id: null })
      await fetchAll()
      setToast({ msg: 'Katılımcı takımdan çıkarıldı.', type: 'info' })
    } catch (e) { setToast({ msg: `Üye çıkarılamadı: ${e.message}`, type: 'error' }) }
  }

  /* ── Görev oluştur (Supabase Client) ── */
  const gorevOlustur = async () => {
    const { hafta, gorev_adi, brief_aciklama, puan_kriterleri, son_teslim_tarihi, gorev_tipi } = gorevForm
    if (!hafta || !gorev_adi.trim() || !brief_aciklama.trim() || !puan_kriterleri.trim() || !son_teslim_tarihi) {
      setToast({ msg: 'Lütfen tüm zorunlu alanları doldurun (★ ile işaretli).', type: 'error' })
      return
    }
    if (gorev_tipi === 'BIREYSEL' && !gorevForm.hedef_katilimci) {
      setToast({ msg: 'Bireysel görev için bir katılımcı seçmelisiniz.', type: 'error' })
      return
    }
    if (gorev_tipi === 'TAKIMSAL' && !gorevForm.hedef_takim) {
      setToast({ msg: 'Takımsal görev için bir takım seçmelisiniz.', type: 'error' })
      return
    }
    setSavingGorev(true)
    try {
      const payload = {
        hafta: Number(gorevForm.hafta),
        gorev_adi: gorevForm.gorev_adi.trim(),
        brief_aciklama: gorevForm.brief_aciklama.trim(),
        puan_kriterleri: gorevForm.puan_kriterleri.trim(),
        son_teslim_tarihi: gorevForm.son_teslim_tarihi,
        maksimum_puan: Number(gorevForm.maksimum_puan) || 100,
        gorev_tipi: gorev_tipi,
        hedef_katilimci_id: gorev_tipi === 'BIREYSEL' ? Number(gorevForm.hedef_katilimci) : null,
        hedef_takim_id:     gorev_tipi === 'TAKIMSAL' ? Number(gorevForm.hedef_takim)     : null,
      }
      await createGorev(payload)
      setGorevModal(false)
      setGorevForm(GOREV_BOSH)
      await fetchAll()
      setToast({ msg: `"${gorev_adi.trim()}" görevi başarıyla oluşturuldu! 🎉`, type: 'success' })
    } catch (e) { setToast({ msg: `Görev oluşturulamadı: ${e.message}`, type: 'error' }) }
    finally { setSavingGorev(false) }
  }

  /* ── Hazır Program Görevini Aktif Et (PROGRAM-TASKS-FIX-01) ── */
  const handleActivateProgramTask = async (taskTemplate) => {
    if (activatingProgramTaskKey) return
    const scoreVal = programTaskScores[taskTemplate.taskKey]
    const numericScore = Number(scoreVal)
    if (!scoreVal || isNaN(numericScore) || numericScore < 1) {
      setToast({ msg: 'Lütfen maksimum puanı girin (en az 1).', type: 'error' })
      return
    }

    setActivatingProgramTaskKey(taskTemplate.taskKey)
    try {
      const res = await activateProgramGorev(taskTemplate, { maksimumPuan: numericScore })
      await fetchAll()
      if (res.created) {
        setToast({ msg: `"${taskTemplate.taskTitle}" görevi (${numericScore} Puan) başarıyla aktif edildi! 🎉`, type: 'success' })
      } else {
        setToast({ msg: res.message || `"${taskTemplate.taskTitle}" zaten aktif.`, type: 'info' })
      }
    } catch (e) {
      console.error('Program görevi aktif edilemedi:', e)
      setToast({ msg: `Görev aktif edilemedi: ${e.message}`, type: 'error' })
    } finally {
      setActivatingProgramTaskKey(null)
    }
  }

  /* ── Program Görevi Materyalini Kaydet (PROGRAM-MATERIALS-UX-01) ── */
  const handleSaveMaterial = async (activeDbGorev, template) => {
    const gorevId = activeDbGorev.id
    const form = materialForms[gorevId] || {}
    setSavingMaterialId(gorevId)

    try {
      let finalUrl = form.material_url || activeDbGorev.material_url || ''
      let finalFileId = form.material_file_id || activeDbGorev.material_file_id || null
      let finalTitle = form.material_title || activeDbGorev.material_title || ''
      let finalType = form.material_type || activeDbGorev.material_type || 'PDF'

      // 1. Eğer yeni bir dosya seçildiyse Google Drive'a yükle
      if (form.material_file) {
        const uploadRes = await uploadProgramMaterialFile(form.material_file, {
          programTaskKey: template.taskKey,
          week: template.taskWeek
        })
        finalUrl = uploadRes.webViewLink || uploadRes.download_url
        finalFileId = uploadRes.file_id
        if (!finalTitle) {
          finalTitle = form.material_file.name
        }
        // Dosya uzantısına göre varsayılan tip belirle
        const fileExt = (form.material_file.name.split('.').pop() || '').toLowerCase()
        if (fileExt === 'pdf') finalType = 'PDF'
        else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExt)) finalType = 'Video'
        else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'].includes(fileExt)) finalType = 'Dosya'
      }

      if (!finalUrl && !finalFileId) {
        setToast({ msg: 'Lütfen bir materyal dosyası yükleyin veya harici bir link girin.', type: 'error' })
        setSavingMaterialId(null)
        return
      }

      if (!finalTitle) {
        finalTitle = `${template.taskWeek}. Hafta Eğitim Materyali`
      }

      await updateGorevMaterial(gorevId, {
        material_title: finalTitle,
        material_url: finalUrl,
        material_type: finalType,
        material_file_id: finalFileId
      })

      setMaterialForms(prev => ({
        ...prev,
        [gorevId]: {
          material_title: finalTitle,
          material_url: finalUrl,
          material_type: finalType,
          material_file_id: finalFileId,
          material_file: null
        }
      }))

      await fetchAll()
      setToast({ msg: 'Eğitim materyali başarıyla kaydedildi! 📄', type: 'success' })
    } catch (e) {
      console.error('Materyal kaydedilemedi:', e)
      setToast({ msg: `Materyal kaydedilemedi: ${e.message}`, type: 'error' })
    } finally {
      setSavingMaterialId(null)
    }
  }

  /* ── Görev sil (Supabase Client) ── */
  const gorevSil = async (gorev) => {
    setDeletingGorev(gorev.id)
    try {
      await deleteGorev(gorev.id)
      await fetchAll()
      setToast({ msg: `"${gorev.gorev_adi}" silindi.`, type: 'info' })
    } catch (e) {
      let rawMsg = String(e.message || '')
      if (rawMsg.toLowerCase().includes('foreign key') || rawMsg.toLowerCase().includes('violates') || rawMsg.toLowerCase().includes('core_teslim')) {
        rawMsg = 'Bu göreve ait teslimler bulunduğu için görev silinemez. Geçmiş veriyi korumak için görev pasifleştirilmeli veya teslimler arşivlenmelidir.'
      }
      setToast({ msg: `Görev silinemedi: ${rawMsg}`, type: 'error' })
    }
    finally { setDeletingGorev(null) }
  }

  /* ── CSV Import (import_candidates_csv via admin-actions) ── */
  const importCsv = async () => {
    if (!importFile) {
      setToast({ msg: 'Lütfen içe aktarılacak bir CSV dosyası seçin.', type: 'error' })
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const csvText = await importFile.text()
      const res = await importCandidatesCsvText(importFile.name, csvText)
      if (res && res.data) {
        const { inserted, skipped, errors, total } = res.data
        setImportResult({
          olusturulan: inserted || 0,
          guncellenen: 0,
          atlanan: skipped || 0,
          toplam: total || 0,
          hatalar: errors || []
        })
        await fetchAll()
        setToast({ msg: `${inserted} aday eklendi, ${skipped} aday atlandı.`, type: 'success' })
      }
    } catch (e) {
      setToast({ msg: `CSV içe aktarma hatası: ${e.message}`, type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  /* ── Sheets URL Import (Bilgilendirme Uyarısı) ── */
  const importSheetsUrl = async () => {
    setToast({
      msg: 'Google Sheets doğrudan içe aktarma sonraki fazda eklenecektir. Lütfen Google Sheets dosyanızı Dosya → İndir → CSV (.csv) olarak indirip CSV sekmesinden yükleyin.',
      type: 'info'
    })
  }


  /* ── Hesaplamalar ── */
  const toplam      = adaylar.length
  const onaylanan   = adaylar.filter(a => a.basvuru_durumu === 'ONAYLANDI').length
  const bekleyen    = adaylar.filter(a => a.basvuru_durumu === 'BEKLIYOR').length
  const takimSayisi = takimlar.length

  const filtered = adaylar.filter(a =>
    [a.ad_soyad, a.universite, a.sinif, a.eposta, a.sosyal_medya].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  // Atanmamış (serbest) katılımcılar (takımlar sekmesi dropdown için - sadece aktifler)
  const serbestUyeler = katilimcilar.filter(k => !k.takim_id && k.program_katilim_durumu !== 'PASIF')
  const serbest = serbestUyeler

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans max-w-full overflow-x-hidden">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-100 shadow-soft flex flex-col z-20">
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral to-orange-400 flex items-center justify-center shadow-md shadow-orange-200">
              <Ic.Dashboard c="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-tight">Dijital Sağlık</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Admin Paneli</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-3 md:py-6 overflow-x-auto md:overflow-x-visible flex md:flex-col gap-1">
          <p className="hidden md:block text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-4 mb-3">Menü</p>
          {[
            { key: 'adaylar',    label: 'Adaylar',          icon: <Ic.Users /> },
            { key: 'takimlar',   label: 'Takımlar',         icon: <Ic.Team /> },
            { key: 'gorevler',   label: 'Görevler',         icon: <Ic.Task /> },
            { key: 'program',    label: 'Haftalık Program', icon: <Ic.Calendar /> },
            { key: 'mentorlar',  label: 'Mentorlar',        icon: <Ic.MentorIcon /> },
            { key: 'performans', label: 'Performans',       icon: <Ic.Star /> },
            { key: 'dna',        label: 'DNA Analizleri',   icon: <Ic.Dna /> },
          ].map(({ key, ...rest }) => (
            <NavItem key={key} {...rest} active={menu === key} onClick={() => setMenu(key)} />
          ))}
        </nav>
        <div className="hidden md:block px-4 py-5 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/20 to-orange-100 flex items-center justify-center">
              <span className="text-xs font-bold text-coral">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">Admin</p>
              <p className="text-[10px] text-gray-400">Yönetici</p>
            </div>
          </div>
          <button onClick={async () => { await logoutUser(); navigate('/login', { replace: true }) }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
            <Ic.Logout /><span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className="flex-1 overflow-x-auto min-w-0">

        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-3 sm:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {menu === 'adaylar'    && '👥 Aday Yönetimi'}
                {menu === 'takimlar'   && '🏆 Takım Yönetimi'}
                {menu === 'gorevler'   && '📋 Görev Yönetimi'}
                {menu === 'program'    && '🗓️ Haftalık Canlı Eğitim Programı'}
                {menu === 'mentorlar'  && '🛡️ Mentor Yönetimi'}
                {menu === 'performans' && '⭐ Katılımcı Performans Yönetimi'}
                {menu === 'dna'        && '🧬 İçerik DNA Analizleri'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button id="admin-refresh-btn" onClick={fetchAll} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm font-medium transition-all border border-gray-200 disabled:opacity-50">
              <span className={loading ? 'animate-spin' : ''}><Ic.Refresh /></span>Yenile
            </button>
          </div>
        </header>

        <div className="px-8 py-8 space-y-8">

          {/* Hata */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div><p className="font-semibold">API bağlantı hatası</p><p className="text-red-500 text-xs mt-0.5">{error}</p></div>
            </div>
          )}

          {/* İstatistik Kartları */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard loading={loading} icon={<Ic.Users c="w-6 h-6" />}  label="Toplam Başvuru"   value={toplam}      color="text-coral"       bg="bg-orange-50" />
            <StatCard loading={loading} icon={<Ic.Check c="w-6 h-6" />}  label="Onaylanan Aday"  value={onaylanan}   color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard loading={loading} icon={<Ic.Team  c="w-6 h-6" />}  label="Kurulan Takım"   value={takimSayisi} color="text-violet"       bg="bg-violet-light" />
            <StatCard loading={loading} icon={<Ic.Task  c="w-6 h-6" />}  label="Bekleyen Başvuru" value={bekleyen}   color="text-amber-600"   bg="bg-amber-50" />
          </section>

          {/* ══════════ ADAYLAR SEKMESİ ══════════ */}
          {menu === 'adaylar' && (
            <section className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Aday Listesi</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{loading ? 'Yükleniyor…' : `${filtered.length} aday gösteriliyor`}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* 48 Saatlik Toplu Şifre Maili Gönder */}
                  <button
                    id="btn-resend-all-invites"
                    onClick={handleResendAllInvitations}
                    disabled={sendingInvites}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-coral border border-orange-200 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                  >
                    {sendingInvites ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-coral border-t-transparent rounded-full animate-spin" />
                        Mailler İletiliyor...
                      </>
                    ) : (
                      <>
                        <span>✉️</span>
                        <span>48s Şifre Maillerini Gönder</span>
                      </>
                    )}
                  </button>

                  {/* İçe Aktar Butonu */}
                  <button
                    id="btn-import-adaylar"
                    onClick={() => { setImportModal(true); setImportResult(null); setImportFile(null); setImportUrl('') }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet border border-violet/20 text-sm font-medium transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                    İçe Aktar
                  </button>
                  {/* Arama */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Ic.Search /></span>
                    <input id="admin-search-input" type="text" placeholder="İsim, üniversite, bölüm…" value={search} onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all w-72" />
                  </div>
                </div>
              </div>


              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {['#', 'Ad Soyad', 'Üniversite', 'Sınıf', 'Durum', 'İşlemler'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                      : filtered.length === 0
                        ? (
                          <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl">🔍</span>
                              <p className="font-medium">{error ? 'Veri yüklenemedi.' : 'Aday bulunamadı.'}</p>
                              {search && <button onClick={() => setSearch('')} className="text-coral text-sm underline">Aramayı temizle</button>}
                            </div>
                          </td></tr>
                        )
                        : filtered.map((aday, idx) => {
                          const isUpd = updating === aday.id
                          return (
                            <tr key={aday.id} className={`border-t border-gray-100 transition-colors duration-150 ${isUpd ? 'bg-orange-50/60' : 'hover:bg-gray-50/80'}`}>
                              <td className="px-5 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/20 to-orange-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-coral">{(aday.ad_soyad ?? '?')[0].toUpperCase()}</span>
                                  </div>
                                  <span className="font-medium text-gray-800 whitespace-nowrap">{aday.ad_soyad}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{aday.universite ?? '—'}</td>
                              <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{aday.sinif ?? '—'}</td>
                              <td className="px-5 py-4">
                                {isUpd
                                  ? <span className="inline-flex items-center gap-2 text-xs text-gray-400"><span className="w-3 h-3 border-2 border-coral border-t-transparent rounded-full animate-spin" />Güncelleniyor…</span>
                                  : <StatusBadge apiDurum={aday.basvuru_durumu} />
                                }
                              </td>
                              {/* İŞLEMLER */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    id={`btn-incele-${aday.id}`}
                                    onClick={() => setModal(aday)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-coral text-xs font-semibold border border-orange-200/60 transition-all"
                                  >
                                    <Ic.Eye c="w-3.5 h-3.5" /> Adayı İncele
                                  </button>
                                  {aday.basvuru_durumu === 'ONAYLANDI' && aday.eposta && (
                                    <button
                                      id={`btn-mail-${aday.id}`}
                                      onClick={() => handleResendSingleInvitation(aday.eposta, aday.ad_soyad)}
                                      disabled={sendingSingleInvite === aday.eposta}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition-all disabled:opacity-60"
                                      title="Bu adaya 48 saat geçerli şifre belirleme bağlantısı gönder"
                                    >
                                      {sendingSingleInvite === aday.eposta ? (
                                        <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <span>✉️ 48s Link</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                    }
                  </tbody>
                </table>
              </div>

              {!loading && filtered.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{filtered.length}</span> aday{search && ` (filtre: "${search}")`}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="font-semibold text-emerald-600">{onaylanan}</span> onaylı</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="font-semibold text-amber-500">{bekleyen}</span> bekliyor</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="font-semibold text-red-500">{adaylar.filter(a => a.basvuru_durumu === 'REDDEDILDI').length}</span> reddedildi</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ══════════ TAKIMLAR SEKMESİ ══════════ */}
          {menu === 'takimlar' && (
            <section className="space-y-6">

              {/* Başlık + Yeni Takım Formu */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-800">Takım Yönetimi</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{loading ? 'Yükleniyor…' : `${takimlar.length} takım · ${serbest.length} atanmamış üye`}</p>
                </div>
                {/* Yeni Takım Oluştur */}
                <div className="flex items-center gap-2">
                  <input
                    id="yeni-takim-input"
                    type="text"
                    placeholder="Yeni takım adı…"
                    value={yeniTakimAdi}
                    onChange={e => setYeniTakimAdi(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && takimOlustur()}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all w-48"
                  />
                  <button
                    id="btn-takim-olustur"
                    onClick={takimOlustur}
                    disabled={!yeniTakimAdi.trim() || creatingTakim}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {creatingTakim ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Ic.Plus c="w-3.5 h-3.5" />}
                    Oluştur
                  </button>
                </div>
                {serbest.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                    {serbest.length} üye bekliyor
                  </span>
                )}
              </div>

              {/* Kart Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-4">
                      <div className="flex gap-3"><div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded animate-pulse w-32" /><div className="h-3 bg-gray-100 rounded animate-pulse w-48" /></div></div>
                      <div className="space-y-2">{[1,2,3].map(j => <div key={j} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                    </div>
                  ))
                  : takimlar.length === 0
                    ? <div className="col-span-full text-center py-16 text-gray-400"><p className="text-4xl mb-3">🏆</p><p className="font-medium">{error ? 'Veri yüklenemedi.' : 'Henüz takım yok.'}</p></div>
                    : takimlar.map((takim) => {
                      const takimUyeleri = katilimcilar.filter(k => k.takim_id && Number(k.takim_id) === Number(takim.id))
                      const isAdding = addingMember === takim.id
                      const isDeleting = deletingTakim === takim.id
                      const dropOpen = activeDropdown === takim.id

                      return (
                        <div key={takim.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 hover:shadow-card transition-all duration-300 overflow-visible min-h-[280px] flex flex-col">

                          {/* Kart Başlık */}
                          <div className="px-6 pt-6 pb-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet/20 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-xl font-black text-violet">{(takim.takim_adi ?? 'T')[0].toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-base">{takim.takim_adi}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{takim.buyuk_gorev_basligi ?? '—'}</p>
                                {/* Mentor — ID bazlı dropdown (v2) */}
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs font-medium text-gray-500">Mentor:</span>
                                  <MentorDropdown
                                    takimId={takim.id}
                                    currentMentorId={takim.mentor}
                                    mentorlar={mentorlar}
                                    onSaved={(id) => mentorGuncelle(takim.id, id)}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Puan */}
                                <div className="text-right mr-2">
                                  <div className="flex items-center gap-1 text-amber-500 justify-end"><Ic.Star /><span className="font-bold text-gray-700 text-sm">{takim.toplam_puan ?? 0}</span></div>
                                  <p className="text-[10px] text-gray-400 mt-0.5">puan</p>
                                </div>
                                {/* Sil butonu */}
                                <button
                                  id={`btn-takim-sil-${takim.id}`}
                                  title="Takımı Sil"
                                  onClick={() => { if (window.confirm(`"${takim.takim_adi}" takımını silmek istediğinize emin misiniz?`)) takimSil(takim) }}
                                  disabled={isDeleting}
                                  className="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                                >
                                  {isDeleting ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" /> : <Ic.Trash />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Üye Listesi */}
                          <div className="px-6 pb-4 flex-1">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Mevcut Üyeler ({takimUyeleri.length})</p>
                            {takimUyeleri.length === 0
                              ? <p className="text-xs text-gray-400 italic py-2">Bu takımda henüz katılımcı yok.</p>
                              : (
                                <div className="space-y-2">
                                  {takimUyeleri.map(uye => {
                                    const isim = uye.ad_soyad || uye.aday_adi || `Katılımcı #${uye.id}`
                                    const eposta = uye.eposta || ''
                                    const uni = uye.universite || uye.aday_universite || ''
                                    return (
                                      <div key={uye.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet/20 to-purple-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-violet">{(isim[0] || '?').toUpperCase()}</span>
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 truncate">
                                              <p className="text-xs font-semibold text-gray-800 truncate">{isim}</p>
                                              {uye.program_katilim_durumu === 'PASIF' && (
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded shrink-0">
                                                  Pasif
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 truncate">
                                              {eposta && <span className="truncate">{eposta}</span>}
                                              {eposta && uni && <span>•</span>}
                                              {uni && <span className="truncate">{uni}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        {/* Üye Çıkar Butonu */}
                                        <button
                                          id={`btn-uye-cikar-${uye.id}`}
                                          title="Takımdan Çıkar"
                                          onClick={() => uyeCikar(uye.id, isim)}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 border border-red-200/60 transition-all flex-shrink-0"
                                        >
                                          <Ic.X c="w-3.5 h-3.5" /> Takımdan Çıkar
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            }
                          </div>

                          {/* Üye Ekle */}
                          <div className="px-6 pb-6 pt-3 border-t border-gray-100 mt-auto relative">
                            {serbestUyeler.length === 0
                              ? <p className="text-xs text-gray-400 italic text-center py-1">Takıma eklenebilecek serbest üye yok.</p>
                              : (
                                <>
                                  <button
                                    id={`btn-uye-ekle-${takim.id}`}
                                    disabled={isAdding}
                                    onClick={() => setActiveDropdown(d => d === takim.id ? null : takim.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-violet/30 text-violet text-sm font-medium hover:bg-violet-light hover:border-violet/50 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {isAdding
                                      ? <><span className="w-3.5 h-3.5 border-2 border-violet border-t-transparent rounded-full animate-spin" />Ekleniyor…</>
                                      : <><Ic.UserPlus />Üye Ekle<Ic.Plus /></>
                                    }
                                  </button>

                                  {dropOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slide-up" style={{boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15)'}}>
                                      <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Atanmamış (Serbest) Üyeler</p>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto rounded-b-2xl">
                                        {serbestUyeler.map(k => {
                                          const aday = adaylar.find(a => a.id === k.aday)
                                          const isim = k.ad_soyad ?? k.aday_adi ?? aday?.ad_soyad ?? `Aday #${k.aday}`
                                          const uni  = k.universite ?? k.aday_universite ?? aday?.universite ?? ''
                                          const email = k.eposta ?? aday?.eposta ?? ''
                                          return (
                                            <button key={k.id} onClick={() => uyeEkle(takim.id, k.id)}
                                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-light text-left transition-colors border-b border-gray-50 last:border-0">
                                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/20 to-orange-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-coral">{isim[0]?.toUpperCase()}</span>
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">{isim}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{email ? `${email} ${uni ? '• ' + uni : ''}` : uni}</p>
                                              </div>
                                              <Ic.Plus c="w-3.5 h-3.5 text-violet ml-auto flex-shrink-0" />
                                            </button>
                                          )
                                        })}
                                      </div>
                                      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                                        <button onClick={() => setActiveDropdown(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Kapat</button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )
                            }
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            </section>
          )}

          {/* ══════════ GÖREVLER ══════════ */}
          {menu === 'gorevler' && (
            <section className="space-y-6">

              {/* Başlık + Yeni Görev Butonu */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-800">Görev Yönetimi</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {loading ? 'Yükleniyor…' : `${gorevler.length} görev tanımlı · Haftalık program ve özel görevler`}
                  </p>
                </div>
                <button
                  id="btn-yeni-gorev"
                  onClick={() => { setGorevForm(GOREV_BOSH); setGorevModal(true) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet to-purple-500 text-white text-sm font-semibold shadow-md shadow-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Ic.Plus c="w-4 h-4" />
                  Özel Görev Ekle
                </button>
              </div>

              {/* ═══════ HAZIR PROGRAM GÖREVLERİ (ŞABLONLAR) ═══════ */}
              <div className="bg-gradient-to-br from-purple-900/5 via-violet-50/50 to-pink-50/40 rounded-3xl border border-violet/20 p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-violet/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚀</span>
                      <h3 className="text-base font-extrabold text-gray-800">Program Görevleri</h3>
                      <span className="text-[10px] font-bold bg-violet text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        Müfredat Entegrasyonu
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Haftalık programdaki hazır saha ve final görevlerini buradan tek tıkla aktif edebilir ve katılımcılara açabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {PROGRAM_TASKS.map((template) => {
                    const activeDbGorev = (gorevler || []).find(g =>
                      g.program_task_key === template.taskKey ||
                      g.gorev_adi === template.taskTitle ||
                      (Number(g.hafta) === Number(template.taskWeek) && g.gorev_adi?.toLowerCase().includes(template.taskTitle.toLowerCase()))
                    )
                    const isAlreadyActive = Boolean(activeDbGorev)
                    const isActivating = activatingProgramTaskKey === template.taskKey
                    const currentScoreInput = programTaskScores[template.taskKey] ?? ''
                    const currentMatForm = materialForms[activeDbGorev?.id] ?? {
                      material_title: activeDbGorev?.material_title || '',
                      material_url: activeDbGorev?.material_url || '',
                      material_type: activeDbGorev?.material_type || 'PDF'
                    }

                    return (
                      <div
                        key={template.taskKey}
                        className={`bg-white rounded-2xl p-5 border shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                          isAlreadyActive ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' : 'border-gray-200/90 hover:border-violet/40 hover:shadow-card'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Üst Hafta Rozeti & Durum */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                              template.taskType === 'final_gorevi'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {template.taskWeek}. HAFTA · {template.typeLabel}
                            </span>
                            {isAlreadyActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hafta Yayında / Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Henüz Aktif Değil
                              </span>
                            )}
                          </div>

                          {/* Başlık & Açıklama */}
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">{template.taskTitle}</h4>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-3">
                              {template.taskDescription}
                            </p>
                          </div>

                          {/* Teslim & Değerlendirme İpuçları */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-[11px]">
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <span className="shrink-0 text-xs">📦</span>
                              <span><strong>Teslim:</strong> {template.deliverableHint}</span>
                            </div>
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <span className="shrink-0 text-xs">🏆</span>
                              <span><strong>Kriter:</strong> {template.evaluationHint}</span>
                            </div>
                          </div>

                          {/* Aktif Görev İçin Materyal Yönetimi (Dosya + Link) */}
                          {isAlreadyActive && activeDbGorev && (
                            <div className="bg-gradient-to-br from-violet-50/70 to-purple-50/50 rounded-2xl p-4 border border-violet/20 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">📄</span>
                                  <h5 className="text-xs font-bold text-gray-800">Eğitim Materyali Yönetimi</h5>
                                </div>
                                {activeDbGorev.material_url ? (
                                  <a
                                    href={activeDbGorev.material_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-violet hover:text-purple-700 underline inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-violet/20 shadow-2xs"
                                  >
                                    Mevcut Materyali Aç ↗
                                  </a>
                                ) : (
                                  <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Henüz Materyal Yok
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2.5 text-xs">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                                    Materyal Başlığı
                                  </label>
                                  <input
                                    type="text"
                                    value={currentMatForm.material_title}
                                    onChange={(e) => setMaterialForms(prev => ({
                                      ...prev,
                                      [activeDbGorev.id]: {
                                        ...currentMatForm,
                                        material_title: e.target.value
                                      }
                                    }))}
                                    placeholder="Örn: 1. Hafta Sunum Slaytı & Vaka Dosyası"
                                    className="w-full px-3 py-1.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet"
                                  />
                                </div>

                                {/* Dosya Seçimi */}
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                                    Dosya Yükle (PDF, Belge, Görsel — Maks 20MB)
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      id={`mat-file-${activeDbGorev.id}`}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0] || null
                                        setMaterialForms(prev => ({
                                          ...prev,
                                          [activeDbGorev.id]: {
                                            ...currentMatForm,
                                            material_file: f,
                                            material_title: currentMatForm.material_title || (f ? f.name : '')
                                          }
                                        }))
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`mat-file-${activeDbGorev.id}`}
                                      className="cursor-pointer px-3 py-1.5 bg-white border border-gray-300 hover:border-violet rounded-lg text-xs font-semibold text-gray-700 shadow-2xs hover:bg-violet-50/50 transition-all inline-flex items-center gap-1.5 shrink-0"
                                    >
                                      <span>📁</span>
                                      <span>{currentMatForm.material_file ? 'Dosyayı Değiştir' : 'Dosya Seç'}</span>
                                    </label>
                                    <div className="text-[11px] text-gray-500 truncate flex-1 min-w-0">
                                      {currentMatForm.material_file ? (
                                        <span className="font-bold text-violet flex items-center gap-1">
                                          <span>✓</span> <span className="truncate">{currentMatForm.material_file.name}</span>
                                          <button
                                            type="button"
                                            onClick={() => setMaterialForms(prev => ({
                                              ...prev,
                                              [activeDbGorev.id]: { ...currentMatForm, material_file: null }
                                            }))}
                                            className="text-red-500 hover:text-red-700 font-bold ml-1"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ) : activeDbGorev.material_file_id ? (
                                        <span className="text-slate-500 italic">Drive'a yüklü dosya mevcut</span>
                                      ) : (
                                        <span className="text-slate-400">Seçilen dosya yok</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                                      veya Harici Link (URL)
                                    </label>
                                    <input
                                      type="url"
                                      value={currentMatForm.material_url}
                                      onChange={(e) => setMaterialForms(prev => ({
                                        ...prev,
                                        [activeDbGorev.id]: {
                                          ...currentMatForm,
                                          material_url: e.target.value
                                        }
                                      }))}
                                      placeholder="https://..."
                                      className="w-full px-2.5 py-1.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                                      Materyal Türü
                                    </label>
                                    <select
                                      value={currentMatForm.material_type}
                                      onChange={(e) => setMaterialForms(prev => ({
                                        ...prev,
                                        [activeDbGorev.id]: {
                                          ...currentMatForm,
                                          material_type: e.target.value
                                        }
                                      }))}
                                      className="w-full px-1.5 py-1.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet font-medium"
                                    >
                                      <option value="PDF">PDF Dosyası</option>
                                      <option value="Dosya">Belge / Dosya</option>
                                      <option value="Video">Video / Kayıt</option>
                                      <option value="Link">Harici Link</option>
                                      <option value="Diger">Diğer</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveMaterial(activeDbGorev, template)}
                                    disabled={savingMaterialId === activeDbGorev.id}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 hover:to-purple-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    {savingMaterialId === activeDbGorev.id ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Yükleniyor & Kaydediliyor…</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>💾</span>
                                        <span>Materyali Kaydet</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Puan ve Buton Alanı */}
                        <div className="pt-4 mt-3 border-t border-gray-100 space-y-3">
                          {isAlreadyActive ? (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                ★ {activeDbGorev?.maksimum_puan ?? 100} Puan
                              </span>
                              <button
                                type="button"
                                disabled
                                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 cursor-default flex items-center gap-1.5"
                              >
                                <span>✓</span>
                                <span>Aktif</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  Maksimum Puan <span className="text-red-400">★</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={currentScoreInput}
                                    onChange={(e) => setProgramTaskScores(prev => ({ ...prev, [template.taskKey]: e.target.value }))}
                                    placeholder="Örn: 100"
                                    className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                                  />
                                  <span className="absolute right-3 top-2 text-[11px] font-semibold text-gray-400 pointer-events-none">
                                    Puan
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleActivateProgramTask(template)}
                                disabled={isActivating || !currentScoreInput}
                                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 hover:to-purple-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isActivating ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Aktif Ediliyor…</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🚀</span>
                                    <span>Görevi {currentScoreInput ? `(${currentScoreInput} Puan ile)` : ''} Aktif Et</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Görev Kartları */}
              {loading
                ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                        <div className="flex gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                            <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-64" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : gorevler.length === 0
                  ? (
                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 py-24 text-center">
                      <div className="w-20 h-20 bg-violet/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <span className="text-4xl">📋</span>
                      </div>
                      <p className="font-bold text-gray-700 text-lg">Henüz görev tanımlanmamış.</p>
                      <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Katılımcılara haftalık görev atamak için yukarıdaki butona tıklayın.</p>
                      <button
                        onClick={() => { setGorevForm(GOREV_BOSH); setGorevModal(true) }}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet/10 text-violet text-sm font-semibold hover:bg-violet/20 transition-all"
                      >
                        <Ic.Plus c="w-4 h-4" />
                        İlk Görevi Ekle
                      </button>
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      {gorevler.map(gorev => {
                        const isDel = deletingGorev === gorev.id
                        const deadline = gorev.son_teslim_tarihi ? new Date(gorev.son_teslim_tarihi) : null
                        const now = new Date()
                        const isOverdue = deadline && deadline < now
                        const diffMs = deadline ? deadline - now : null
                        const diffDays = diffMs ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : null
                        const tarih = deadline
                          ? deadline.toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'

                        return (
                          <div
                            key={gorev.id}
                            className={`bg-white rounded-2xl shadow-soft border transition-all duration-300 hover:shadow-card overflow-hidden ${
                              isOverdue ? 'border-red-200' : 'border-gray-100'
                            }`}
                          >
                            {/* Üst renk şeridi */}
                            <div className={`h-1 w-full ${
                              isOverdue
                                ? 'bg-gradient-to-r from-red-400 to-rose-400'
                                : diffDays !== null && diffDays <= 3
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                  : 'bg-gradient-to-r from-violet to-purple-400'
                            }`} />

                            <div className="p-6">
                              <div className="flex items-start gap-5">

                                {/* Hafta rozeti */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet/15 to-purple-100 shadow-sm border border-violet/10">
                                  <span className="text-[9px] font-black text-violet/60 uppercase tracking-widest leading-none">HAFTA</span>
                                  <span className="text-3xl font-black text-violet leading-tight">{gorev.hafta}</span>
                                </div>

                                {/* İçerik */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">

                                      {/* Görev adı + tipi + kime atandığı */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-800 text-base">{gorev.gorev_adi}</h3>
                                        {/* Görev tipi badge */}
                                        {gorev.gorev_tipi === 'GENEL' && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                            🌐 Genel Görev
                                          </span>
                                        )}
                                        {gorev.gorev_tipi === 'BIREYSEL' && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                            👤 Katılımcı: {gorev.hedef_katilimci_adi ?? '—'}
                                          </span>
                                        )}
                                        {gorev.gorev_tipi === 'TAKIMSAL' && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-violet/10 text-violet border-violet/20">
                                            👥 Takım: {gorev.hedef_takim_adi ?? '—'}
                                          </span>
                                        )}
                                      </div>

                                      {/* Tarih + puan + deadline badge */}
                                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                          <span>📅</span>
                                          <span className="font-medium">{tarih}</span>
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                          <Ic.Star c="w-3 h-3" /> {gorev.maksimum_puan ?? 100} puan
                                        </span>
                                        {deadline && (
                                          isOverdue
                                            ? <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">🔴 Süresi doldu</span>
                                            : diffDays !== null && diffDays <= 3
                                              ? <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">⚠️ {diffDays} gün kaldı</span>
                                              : <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✅ {diffDays} gün kaldı</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sil butonu */}
                                    <button
                                      id={`btn-gorev-sil-${gorev.id}`}
                                      title="Görevi Sil"
                                      disabled={isDel}
                                      onClick={() => {
                                        if (window.confirm(`"${gorev.gorev_adi}" görevini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`))
                                      gorevSil(gorev)
                                      }}
                                      className="p-2 rounded-xl text-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40 flex-shrink-0 group"
                                    >
                                      {isDel
                                        ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                                        : <Ic.Trash c="w-4 h-4" />}
                                    </button>
                                  </div>

                                  {/* Brief + Kriterler — ikili grid */}
                                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {gorev.brief_aciklama && (
                                      <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                          <span>📝</span> Brief / Açıklama
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{gorev.brief_aciklama}</p>
                                      </div>
                                    )}
                                    {gorev.puan_kriterleri && (
                                      <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100">
                                        <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                          <span>🏆</span> Puan Kriterleri
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{gorev.puan_kriterleri}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Görev Teslimleri & Katılımcı Takip Matrisi */}
                                  {(() => {
                                    const gid = String(gorev.id)
                                    const gorevTeslimleri = (Array.isArray(teslimler) ? teslimler : []).filter(t => {
                                      if (!t) return false
                                      const tGid = String(t.gorev || t.gorev_id || (t.gorev_obj && t.gorev_obj.id) || '')
                                      return tGid === gid || (gorev.program_task_key && (t.program_task_key === gorev.program_task_key || t.gorev_obj?.program_task_key === gorev.program_task_key))
                                    })

                                    // Target participants for this task
                                    const targetKatilimcilar = (katilimcilar || []).filter(kat => {
                                      if (gorev.hedef_katilimci_id || gorev.hedef_katilimci || gorev.katilimci_id || gorev.katilimci) {
                                        return Number(kat.id) === Number(gorev.hedef_katilimci_id || gorev.hedef_katilimci || gorev.katilimci_id || gorev.katilimci)
                                      }
                                      if (gorev.hedef_takim_id || gorev.hedef_takim || gorev.takim_id || gorev.takim) {
                                        return Number(kat.takim_id) === Number(gorev.hedef_takim_id || gorev.hedef_takim || gorev.takim_id || gorev.takim)
                                      }
                                      return true // GENEL task: all participants
                                    })

                                    const totalTargetCount = targetKatilimcilar.length
                                    const teslimEdenCount = targetKatilimcilar.filter(k => gorevTeslimleri.some(t => Number(t.katilimci || t.katilimci_id) === Number(k.id))).length
                                    const teslimEtmeyenCount = Math.max(0, totalTargetCount - teslimEdenCount)
                                    const bekleyenCount = gorevTeslimleri.filter(t => t.durum === 'BEKLIYOR').length
                                    const revizyonCount = gorevTeslimleri.filter(t => t.durum === 'REVIZYON_ISTENDI' || t.durum === 'REVIZE_EDILDI').length
                                    const tamamlananCount = gorevTeslimleri.filter(t => t.durum === 'TAMAMLANDI').length

                                     return (
                                       <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                                         
                                         {/* Özet İstatistik Çubuğu */}
                                         <div className="flex items-center justify-between flex-wrap gap-2">
                                           <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                             <span>📦</span> Katılımcı Teslim Durumu ({teslimEdenCount}/{totalTargetCount} Teslim Edildi)
                                           </span>
                                           
                                           <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                                             <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                               👥 Toplam: {totalTargetCount}
                                             </span>
                                             <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                               📥 Teslim: {teslimEdenCount}
                                             </span>
                                             <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                               ⏳ Bekleyen: {teslimEtmeyenCount}
                                             </span>
                                             {bekleyenCount > 0 && (
                                               <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                                 🔍 İnceleme: {bekleyenCount}
                                               </span>
                                             )}
                                             {revizyonCount > 0 && (
                                               <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                                                 🔄 Revizyon: {revizyonCount}
                                               </span>
                                             )}
                                             {tamamlananCount > 0 && (
                                               <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                                                 ✅ Puanlandı: {tamamlananCount}
                                               </span>
                                             )}
                                           </div>
                                         </div>

                                         {/* Katılımcı Bazlı Matris Tablosu */}
                                         <div className="bg-gray-50/70 border border-gray-200/70 rounded-2xl overflow-hidden">
                                           {targetKatilimcilar.length === 0 ? (
                                             <div className="p-4 text-center text-xs text-gray-400 italic">
                                               Bu göreve atanmış katılımcı bulunamadı.
                                             </div>
                                           ) : (
                                             <div className="divide-y divide-gray-200/60">
                                               {targetKatilimcilar.map(kat => {
                                                 const katDelivery = gorevTeslimleri.find(t => Number(t.katilimci || t.katilimci_id) === Number(kat.id))
                                                 const takimObj = takimlar.find(tk => Number(tk.id) === Number(kat.takim_id))
                                                 const takimAdi = kat.takim_adi || takimObj?.takim_adi || 'Takımsız'
                                                 const hasSubmitted = Boolean(katDelivery)
                                                 const dStatus = katDelivery?.durum || (hasSubmitted ? 'BEKLIYOR' : 'YOK')

                                                 return (
                                                   <div key={kat.id} className="p-3 sm:p-3.5 flex flex-col gap-2 hover:bg-white/80 transition-colors">
                                                     <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                                                       
                                                       {/* Katılımcı Bilgisi */}
                                                       <div className="flex items-center gap-2.5 min-w-[200px]">
                                                         <div className="w-7 h-7 rounded-full bg-violet/10 text-violet font-bold text-[11px] flex items-center justify-center shrink-0">
                                                           {(kat.ad_soyad || kat.ad || '?')[0].toUpperCase()}
                                                         </div>
                                                         <div>
                                                           <p className="font-bold text-gray-800">{kat.ad_soyad || `${kat.ad || ''} ${kat.soyad || ''}`.trim() || `Katılımcı #${kat.id}`}</p>
                                                           <p className="text-[10px] text-gray-400 font-mono">{kat.eposta || '—'}</p>
                                                         </div>
                                                       </div>

                                                       {/* Takım */}
                                                       <div className="shrink-0">
                                                         <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-semibold text-gray-600">
                                                           {takimAdi}
                                                         </span>
                                                       </div>

                                                       {/* Teslim Durumu Rozeti */}
                                                       <div className="shrink-0">
                                                         {dStatus === 'TAMAMLANDI' && (
                                                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                             Tamamlandı
                                                           </span>
                                                         )}
                                                         {dStatus === 'REVIZYON_ISTENDI' && (
                                                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-bold text-[10px]">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                             Revizyon İstendi
                                                           </span>
                                                         )}
                                                         {dStatus === 'REVIZE_EDILDI' && (
                                                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[10px]">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                             Revize Edildi
                                                           </span>
                                                         )}
                                                         {dStatus === 'BEKLIYOR' && (
                                                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px]">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                             İncelenmeyi Bekliyor
                                                           </span>
                                                         )}
                                                         {dStatus === 'YOK' && (
                                                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium text-[10px]">
                                                             Henüz teslim yapmadı ⏳
                                                           </span>
                                                         )}
                                                       </div>

                                                       {/* Puan / Detay Butonu */}
                                                       <div className="flex items-center gap-2 shrink-0">
                                                         {hasSubmitted ? (
                                                           <>
                                                             <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px]">
                                                               {katDelivery.alinan_puan !== null && katDelivery.alinan_puan !== undefined
                                                                 ? `${katDelivery.alinan_puan} / ${gorev.maksimum_puan || 100} P`
                                                                 : `Maks: ${gorev.maksimum_puan || 100} P`}
                                                             </span>

                                                             {katDelivery.teslim_dosyasi_url || katDelivery.teslim_dosyasi ? (
                                                               <a
                                                                 href={katDelivery.teslim_dosyasi_url || katDelivery.teslim_dosyasi}
                                                                 target="_blank"
                                                                 rel="noreferrer"
                                                                 className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-colors inline-flex items-center gap-1"
                                                               >
                                                                 <span>📎 Dosya</span>
                                                               </a>
                                                             ) : null}

                                                             {katDelivery.teslim_linki ? (
                                                               <a
                                                                 href={katDelivery.teslim_linki}
                                                                 target="_blank"
                                                                 rel="noreferrer"
                                                                 className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200 transition-colors inline-flex items-center gap-1"
                                                               >
                                                                 <span>🔗 Link</span>
                                                               </a>
                                                             ) : null}
                                                           </>
                                                         ) : (
                                                           <span className="text-[10px] text-gray-400 italic">
                                                             Teslim bekleniyor
                                                           </span>
                                                         )}
                                                       </div>

                                                     </div>

                                                     {/* Teslim Varsa Timeline ve Notlar */}
                                                     {hasSubmitted && katDelivery.hareketler && katDelivery.hareketler.length > 0 && (
                                                       <div className="mt-1 pt-1.5 border-t border-gray-100">
                                                         <details className="text-xs group">
                                                           <summary className="cursor-pointer text-[10px] font-bold text-violet hover:underline inline-flex items-center gap-1">
                                                             <span>📜 Katılımcı İşlem Geçmişi ({katDelivery.hareketler.length} hareket)</span>
                                                           </summary>
                                                           <div className="mt-2 pl-2">
                                                             <TeslimTimeline hareketler={katDelivery.hareketler} />
                                                           </div>
                                                         </details>
                                                       </div>
                                                     )}
                                                   </div>
                                                 )
                                               })}
                                             </div>
                                           )}
                                         </div>

                                       </div>
                                     )
                                   })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
              }
            </section>
          )}

          {/* ══════════ HAFTALIK PROGRAM SEKMESİ ══════════ */}
          {menu === 'program' && (
            <section className="space-y-8">
              {/* Başlık & Bilgilendirme */}
              <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider uppercase">
                    <span>🗓️</span> Canlı Ders & Canlı Oturum Yönetimi
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Haftalık Eğitim Programı & Canlı Yayınlar
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
                    Salı ve Perşembe 19:00 canlı Zoom derslerini, takvim davetlerini ve haftaların katılımcı görünürlüğünü buradan bağımsız yönetebilirsiniz. Bir haftayı aktif ettiğinizde katılımcılar haftanın oturumlarını ve Zoom bağlantılarını anında görür. Görev sistemi bu alandan bağımsız çalışır.
                  </p>
                </div>
              </div>

              {/* 3 Hafta Kartları */}
              <div className="space-y-8">
                {([1, 2, 3]).map((haftaNo) => {
                  const dbHafta = programHaftalari.find(h => Number(h.hafta) === haftaNo) || {
                    hafta: haftaNo,
                    baslik: `${haftaNo}. Hafta`,
                    hedef: '',
                    aktif: false,
                    sali_aktif: true,
                    persembe_aktif: true,
                    sali_zoom_url: 'https://us06web.zoom.us/j/89490424441?pwd=t3edWpY1m0Vh37kg9I7AsV0nyll1nP.1',
                    sali_calendar_url: 'https://us06web.zoom.us/meeting/tZ0pfumsrD8uHtUo3YmaRUGtvjRbabuDiGT6/ics?icsToken=DGEu-nEGL9lk-0t6SAAALAAAAKeEbH7SUK7pA9n6NqViJmw2dxqO3xbOjJ5QtLRvx5btCFOfYK5LVn8Q9ayNm7XpvhT6ovT-QG1BK0jQ8DAwMDAwMg&meetingMasterEventId=BmN668jBQsClNpVfaeI5FA',
                    sali_meeting_id: '894 9042 4441',
                    sali_passcode: '028359',
                    persembe_zoom_url: 'https://us06web.zoom.us/j/82503028748?pwd=tFq1DRiTRRP0NhXtR4tRbb5akbeQh6.1',
                    persembe_calendar_url: 'https://us06web.zoom.us/meeting/tZYod-qorDMtHtzzqHwbZr2npVRPFj35VvdH/ics?icsToken=DIrwF6pseC-HkaBijgAALAAAAENRjQhmZPyBHQIRw8tiRuKCJymxuIe4URp3AwAxkMkOLwQ7zG50BRXIrIiCDvW9nBBjYLgKXMFFJoUPtTAwMDAwMg&meetingMasterEventId=rNVKAcW4T3uK3iSqgflUhA',
                    persembe_meeting_id: '825 0302 8748',
                    persembe_passcode: '386049'
                  }
                  const staticWeek = PROGRAM_WEEKS.find(w => w.week === haftaNo)
                  const edits = haftaEdits[haftaNo] || {}
                  const isSaving = savingHaftaNo === haftaNo

                  const currentBaslik = edits.baslik !== undefined ? edits.baslik : (dbHafta.baslik || staticWeek?.title || '')
                  const currentHedef = edits.hedef !== undefined ? edits.hedef : (dbHafta.hedef || staticWeek?.goal || '')
                  const currentSaliZoom = edits.sali_zoom_url !== undefined ? edits.sali_zoom_url : (dbHafta.sali_zoom_url || '')
                  const currentSaliCal = edits.sali_calendar_url !== undefined ? edits.sali_calendar_url : (dbHafta.sali_calendar_url || '')
                  const currentSaliMid = edits.sali_meeting_id !== undefined ? edits.sali_meeting_id : (dbHafta.sali_meeting_id || '')
                  const currentSaliPass = edits.sali_passcode !== undefined ? edits.sali_passcode : (dbHafta.sali_passcode || '')
                  const currentPersembeZoom = edits.persembe_zoom_url !== undefined ? edits.persembe_zoom_url : (dbHafta.persembe_zoom_url || '')
                  const currentPersembeCal = edits.persembe_calendar_url !== undefined ? edits.persembe_calendar_url : (dbHafta.persembe_calendar_url || '')
                  const currentPersembeMid = edits.persembe_meeting_id !== undefined ? edits.persembe_meeting_id : (dbHafta.persembe_meeting_id || '')
                  const currentPersembePass = edits.persembe_passcode !== undefined ? edits.persembe_passcode : (dbHafta.persembe_passcode || '')

                  const saliDay = staticWeek?.days?.find(d => d.dayName.toLowerCase().includes('salı'))
                  const persembeDay = staticWeek?.days?.find(d => d.dayName.toLowerCase().includes('perşembe'))

                  return (
                    <div
                      key={haftaNo}
                      className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden transition-all"
                    >
                      {/* Hafta Başlığı & Durum Toggle Barı */}
                      <div className="bg-gradient-to-r from-orange-50/80 via-pink-50/60 to-purple-50/40 p-6 sm:p-7 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="bg-gradient-to-r from-coral to-orange-400 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-xs tracking-wide">
                              {haftaNo}. HAFTA
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              dbHafta.aktif
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${dbHafta.aktif ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              {dbHafta.aktif ? 'Katılımcı Panelinde Görünüyor (Aktif)' : 'Katılımcı Panelinde Gizli (Pasif)'}
                            </span>
                          </div>
                        </div>

                        {/* Aktif / Pasif Butonu */}
                        <div className="flex items-center gap-3">
                          <button
                            id={`btn-toggle-hafta-${haftaNo}`}
                            type="button"
                            onClick={() => handleToggleHaftaAktif(dbHafta)}
                            disabled={isSaving}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
                              dbHafta.aktif
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200'
                            } disabled:opacity-50`}
                          >
                            {isSaving ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : dbHafta.aktif ? (
                              <span>🔒 Haftayı Katılımcılara Kapat</span>
                            ) : (
                              <span>🔓 Haftayı Katılımcılara Aç</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Hafta Başlık & Hedef Edit */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          <div className="lg:col-span-6 space-y-1.5">
                            <label className="block text-xs font-bold text-gray-700">
                              Hafta Başlığı
                            </label>
                            <input
                              type="text"
                              value={currentBaslik}
                              onChange={(e) => handleHaftaFieldChange(haftaNo, 'baslik', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/10 bg-white"
                              placeholder="Hafta Başlığı"
                            />
                          </div>

                          <div className="lg:col-span-6 space-y-1.5">
                            <label className="block text-xs font-bold text-gray-700">
                              Haftanın Hedefi (Kazanım)
                            </label>
                            <textarea
                              rows={2}
                              value={currentHedef}
                              onChange={(e) => handleHaftaFieldChange(haftaNo, 'hedef', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/10 bg-white"
                              placeholder="Haftanın hedefi..."
                            />
                          </div>
                        </div>

                        {/* Günler ve Zoom Yönetimi (Salı & Perşembe) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                          {/* SALI EĞİTİMİ KARTI */}
                          <div className="bg-gradient-to-b from-amber-50/50 via-orange-50/20 to-white rounded-3xl p-6 sm:p-7 border-2 border-amber-200/80 space-y-5 shadow-2xs relative">
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-xl uppercase tracking-wider shadow-2xs">
                                  🗓️ 1. Gün · Salı Canlı Eğitimi
                                </span>
                                <p className="text-xs font-bold text-gray-700 pt-1">
                                  {saliDay?.title || 'Salı Eğitimi'} · 19:00 İstanbul
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleGunAktif(dbHafta, 'sali_aktif')}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                  dbHafta.sali_aktif !== false
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {dbHafta.sali_aktif !== false ? '🟢 Canlı Açık' : '⚪ Canlı Pasif'}
                              </button>
                            </div>

                            {/* Salı Oturum Müfredat Özeti */}
                            <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-100 space-y-2">
                              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                                📚 Müfredat Oturumları (3 Oturum):
                              </p>
                              <div className="space-y-1 text-xs text-slate-700">
                                {(saliDay?.sessions || []).map((s, i) => (
                                  <div key={i} className="flex items-start gap-1.5 leading-snug">
                                    <span className="text-orange-500 font-bold">•</span>
                                    <span className="font-semibold">{s.sessionNumber}. {s.title}</span>
                                    <span className="text-[10px] text-slate-400">({s.duration})</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Salı Zoom Linkleri & ID/Parola */}
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Salı Zoom Katılım Linki
                                </label>
                                <input
                                  type="text"
                                  value={currentSaliZoom}
                                  onChange={(e) => handleHaftaFieldChange(haftaNo, 'sali_zoom_url', e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                  placeholder="https://us06web.zoom.us/j/..."
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Salı Takvime Ekle (iCalendar .ics) Linki
                                </label>
                                <input
                                  type="text"
                                  value={currentSaliCal}
                                  onChange={(e) => handleHaftaFieldChange(haftaNo, 'sali_calendar_url', e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                  placeholder="https://us06web.zoom.us/meeting/.../ics?..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Salı Meeting ID
                                  </label>
                                  <input
                                    type="text"
                                    value={currentSaliMid}
                                    onChange={(e) => handleHaftaFieldChange(haftaNo, 'sali_meeting_id', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                    placeholder="894 9042 4441"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Salı Parola
                                  </label>
                                  <input
                                    type="text"
                                    value={currentSaliPass}
                                    onChange={(e) => handleHaftaFieldChange(haftaNo, 'sali_passcode', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                    placeholder="028359"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* PERŞEMBE EĞİTİMİ KARTI */}
                          <div className="bg-gradient-to-b from-indigo-50/50 via-violet-50/20 to-white rounded-3xl p-6 sm:p-7 border-2 border-indigo-200/80 space-y-5 shadow-2xs relative">
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-indigo-200/60">
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-gradient-to-r from-indigo-600 to-violet px-3 py-1 rounded-xl uppercase tracking-wider shadow-2xs">
                                  🗓️ 2. Gün · Perşembe Canlı Eğitimi
                                </span>
                                <p className="text-xs font-bold text-gray-700 pt-1">
                                  {persembeDay?.title || 'Perşembe Eğitimi'} · 19:00 İstanbul
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleGunAktif(dbHafta, 'persembe_aktif')}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                  dbHafta.persembe_aktif !== false
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {dbHafta.persembe_aktif !== false ? '🟢 Canlı Açık' : '⚪ Canlı Pasif'}
                              </button>
                            </div>

                            {/* Perşembe Oturum Müfredat Özeti */}
                            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
                              <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                                📚 Müfredat Oturumları (3 Oturum):
                              </p>
                              <div className="space-y-1 text-xs text-slate-700">
                                {(persembeDay?.sessions || []).map((s, i) => (
                                  <div key={i} className="flex items-start gap-1.5 leading-snug">
                                    <span className="text-indigo-500 font-bold">•</span>
                                    <span className="font-semibold">{s.sessionNumber}. {s.title}</span>
                                    {s.guest && <span className="text-[10px] text-purple-700 font-bold">(🎙️ {s.guest})</span>}
                                    <span className="text-[10px] text-slate-400">({s.duration})</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Perşembe Zoom Linkleri & ID/Parola */}
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Perşembe Zoom Katılım Linki
                                </label>
                                <input
                                  type="text"
                                  value={currentPersembeZoom}
                                  onChange={(e) => handleHaftaFieldChange(haftaNo, 'persembe_zoom_url', e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                  placeholder="https://us06web.zoom.us/j/..."
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Perşembe Takvime Ekle (iCalendar .ics) Linki
                                </label>
                                <input
                                  type="text"
                                  value={currentPersembeCal}
                                  onChange={(e) => handleHaftaFieldChange(haftaNo, 'persembe_calendar_url', e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                  placeholder="https://us06web.zoom.us/meeting/.../ics?..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Perşembe Meeting ID
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPersembeMid}
                                    onChange={(e) => handleHaftaFieldChange(haftaNo, 'persembe_meeting_id', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                    placeholder="825 0302 8748"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Perşembe Parola
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPersembePass}
                                    onChange={(e) => handleHaftaFieldChange(haftaNo, 'persembe_passcode', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-coral bg-white"
                                    placeholder="386049"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Kaydet Butonu */}
                        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                          <button
                            id={`btn-save-hafta-${haftaNo}`}
                            type="button"
                            onClick={() => handleSaveHaftaDetails(dbHafta)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-md shadow-orange-200 hover:shadow-lg transition-all disabled:opacity-60"
                          >
                            {isSaving ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Kaydediliyor...</span>
                              </>
                            ) : (
                              <>
                                <span>💾</span>
                                <span>{haftaNo}. Hafta Bilgilerini Kaydet</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ══════════ MENTORLAR SEKMESİ ══════════ */}
          {menu === 'mentorlar' && (
            <section className="space-y-6">

              {/* Başlık + Yeni Mentor Formu */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-800">Marka Mutfağı Ekibi</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {loading ? 'Yükleniyor…' : `${mentorlar.length} mentor kayıtlı · Bağımsız Marka Mutfağı üyeleri`}
                  </p>
                </div>
                <button
                  id="btn-yeni-mentor"
                  onClick={() => { setMentorForm(MENTOR_BOSH); setShowMentorForm(f => !f) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet text-white text-sm font-semibold shadow-md shadow-indigo-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Ic.Plus c="w-4 h-4" />
                  Yeni Mentor Ekle
                </button>
              </div>

              {/* Yeni Mentor Formu (toggle) */}
              {showMentorForm && (
                <div className="bg-white rounded-2xl shadow-soft border border-indigo-100 p-6 animate-slide-up">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Ic.MentorIcon c="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Yeni Mentor Ekle</p>
                      <p className="text-xs text-gray-400 mt-0.5">Marka Mutfağı ekibine yeni üye ekleyin</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ad Soyad <span className="text-red-400">★</span></label>
                      <input
                        id="mentor-ad-soyad"
                        type="text"
                        value={mentorForm.ad_soyad}
                        onChange={e => setMentorForm(f => ({ ...f, ad_soyad: e.target.value }))}
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-posta <span className="text-red-400">★</span></label>
                      <input
                        id="mentor-eposta"
                        type="email"
                        value={mentorForm.eposta}
                        onChange={e => setMentorForm(f => ({ ...f, eposta: e.target.value }))}
                        placeholder="ornek@mail.com"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Uzmanlık</label>
                      <input
                        id="mentor-uzmanlik"
                        type="text"
                        value={mentorForm.uzmanlik}
                        onChange={e => setMentorForm(f => ({ ...f, uzmanlik: e.target.value }))}
                        placeholder="Örn: Dijital Pazarlama"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Geçici Şifre</label>
                      <input
                        id="mentor-gecici-sifre"
                        type="password"
                        value={mentorForm.gecici_sifre || ''}
                        onChange={e => setMentorForm(f => ({ ...f, gecici_sifre: e.target.value }))}
                        placeholder="Giriş şifresi belirleyin"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setShowMentorForm(false); setMentorForm(MENTOR_BOSH) }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all"
                    >İptal</button>
                    <button
                      id="btn-mentor-kaydet"
                      onClick={mentorOlustur}
                      disabled={savingMentor}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {savingMentor
                        ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor…</>
                        : <><Ic.Check c="w-3.5 h-3.5" />Mentoru Kaydet</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Mentor Listesi */}
              {loading
                ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : mentorlar.length === 0
                  ? (
                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 py-24 text-center">
                      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Ic.MentorIcon c="w-10 h-10 text-indigo-400" />
                      </div>
                      <p className="font-bold text-gray-700 text-lg">Henüz mentor eklenmemiş.</p>
                      <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Marka Mutfağı ekibine ilk mentoru eklemek için yukarıdaki butona tıklayın.</p>
                      <button
                        onClick={() => setShowMentorForm(true)}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-all"
                      >
                        <Ic.Plus c="w-4 h-4" />
                        İlk Mentoru Ekle
                      </button>
                    </div>
                  )
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {mentorlar.map(mentor => {
                        const isDel = deletingMentor === mentor.id
                        const atanenTakimlar = takimlar.filter(t => t.mentor === mentor.id)
                        return (
                          <div
                            key={mentor.id}
                            className="bg-white rounded-2xl shadow-soft border border-gray-100 hover:shadow-card transition-all duration-300 overflow-hidden flex flex-col"
                          >
                            {/* Üst renk şeridi */}
                            <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-violet" />

                            <div className="p-6 flex-1">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <span className="text-xl font-black text-indigo-600">{(mentor.ad_soyad ?? 'M')[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-800 text-base truncate">{mentor.ad_soyad}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 truncate">{mentor.eposta}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {mentor.uzmanlik && (
                                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        🎯 {mentor.uzmanlik}
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      mentor.has_user || mentor.user
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${mentor.has_user || mentor.user ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                      {mentor.has_user || mentor.user ? 'Giriş hesabı var' : 'Giriş hesabı yok'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  id={`btn-mentor-sil-${mentor.id}`}
                                  title="Mentoru Sil"
                                  disabled={isDel}
                                  onClick={() => {
                                    if (window.confirm(`"${mentor.ad_soyad}" mentorunu silmek istediğinize emin misiniz?`))
                                      mentorSil(mentor)
                                  }}
                                  className="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40 flex-shrink-0"
                                >
                                  {isDel
                                    ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                                    : <Ic.Trash />}
                                </button>
                              </div>

                              {/* Atandığı takımlar */}
                              {atanenTakimlar.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Atandığı Takımlar</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {atanenTakimlar.map(t => (
                                      <span key={t.id} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20">
                                        {t.takim_adi}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
              }
            </section>
          )}

          {/* ══════════ PERFORMANS SEKMESİ ══════════ */}
          {menu === 'performans' && (
            <PerformansSection
              setToast={setToast}
            />
          )}

          {/* ══════════ İÇERİK DNA ANALİZLERİ SEKMESİ ══════════ */}
          {menu === 'dna' && (
            <DnaSection
              dnaList={dnaList}
              setDnaList={setDnaList}
              dnaLoading={dnaLoading}
              setDnaLoading={setDnaLoading}
              dnaError={dnaError}
              setDnaError={setDnaError}
              dnaDetail={dnaDetail}
              setDnaDetail={setDnaDetail}
              dnaRegen={dnaRegen}
              setDnaRegen={setDnaRegen}
              setToast={setToast}
            />
          )}

        </div>
      </main>

      {/* Aday Modal */}
      <AdayModal aday={modal} onClose={() => setModal(null)} onDurumGuncelle={durumGuncelle} updating={updating} />

      {/* Görev Modal */}
      {gorevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setGorevModal(false); setGorevForm(GOREV_BOSH) }} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-slide-up">

            {/* Modal Başlık */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet/20 to-purple-100 flex items-center justify-center">
                  <Ic.Task c="w-5 h-5 text-violet" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Yeni Görev Ekle</h2>
                  <p className="text-xs text-gray-400 mt-0.5">★ ile işaretli alanlar zorunludur</p>
                </div>
              </div>
              <button
                onClick={() => { setGorevModal(false); setGorevForm(GOREV_BOSH) }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              >
                <Ic.Close />
              </button>
            </div>

            {/* Form */}
            <div className="px-8 py-7 space-y-6">

              {/* Satır 1: Hafta + Görev Tipi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Hafta No <span className="text-red-400">★</span>
                  </label>
                  <input
                    id="gorev-hafta"
                    type="number" min="1" max="52"
                    value={gorevForm.hafta}
                    onChange={e => setGorevForm(f => ({ ...f, hafta: e.target.value }))}
                    placeholder="1"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Görev Tipi</label>
                  <select
                    id="gorev-tipi"
                    value={gorevForm.gorev_tipi}
                    onChange={e => setGorevForm(f => ({ ...f, gorev_tipi: e.target.value, hedef_katilimci: '', hedef_takim: '' }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                  >
                    <option value="GENEL">🌐 Genel Görev</option>
                    <option value="BIREYSEL">👤 Bireysel Görev</option>
                    <option value="TAKIMSAL">👥 Takımsal Görev</option>
                  </select>
                </div>
              </div>

              {/* Dinamik Hedef Seçimi */}
              {gorevForm.gorev_tipi === 'BIREYSEL' && (
                <div className="animate-slide-up">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Katılımcı Seç <span className="text-red-400">★</span>
                  </label>
                  <select
                    id="gorev-hedef-katilimci"
                    value={gorevForm.hedef_katilimci}
                    onChange={e => setGorevForm(f => ({ ...f, hedef_katilimci: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400 transition-all"
                  >
                    <option value="">— Katılımcı seçin —</option>
                    {katilimcilar
                      .filter(k => k.program_katilim_durumu === 'AKTIF')
                      .map(k => {
                        const aday = adaylar.find(a => a.id === k.aday)
                        const isim = k.aday_ad_soyad ?? k.aday_adi ?? aday?.ad_soyad ?? `Katılımcı #${k.id}`
                        return <option key={k.id} value={k.id}>{isim}</option>
                      })
                    }
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1.5">Yalnızca aktif katılımcılar listeleniyor.</p>
                </div>
              )}

              {gorevForm.gorev_tipi === 'TAKIMSAL' && (
                <div className="animate-slide-up">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Takım Seç <span className="text-red-400">★</span>
                  </label>
                  <select
                    id="gorev-hedef-takim"
                    value={gorevForm.hedef_takim}
                    onChange={e => setGorevForm(f => ({ ...f, hedef_takim: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-violet/30 bg-violet/5 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                  >
                    <option value="">— Takım seçin —</option>
                    {takimlar.map(t => (
                      <option key={t.id} value={t.id}>{t.takim_adi}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Satır 2: Görev Adı */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Görev Adı <span className="text-red-400">★</span>
                </label>
                <input
                  id="gorev-adi"
                  type="text"
                  value={gorevForm.gorev_adi}
                  onChange={e => setGorevForm(f => ({ ...f, gorev_adi: e.target.value }))}
                  placeholder="Örn: Dijital Sağlık Pazar Araştırması & Analizi"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                />
              </div>

              {/* Satır 3: Brief Açıklaması */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Brief Açıklaması <span className="text-red-400">★</span>
                </label>
                <textarea
                  id="gorev-brief"
                  rows={5}
                  value={gorevForm.brief_aciklama}
                  onChange={e => setGorevForm(f => ({ ...f, brief_aciklama: e.target.value }))}
                  placeholder="Görevin detaylı açıklaması, beklentiler, teslim formatı ve kaynaklar…"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Satır 4: Puan Kriterleri */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Puan Kriterleri <span className="text-red-400">★</span>
                </label>
                <textarea
                  id="gorev-puan"
                  rows={4}
                  value={gorevForm.puan_kriterleri}
                  onChange={e => setGorevForm(f => ({ ...f, puan_kriterleri: e.target.value }))}
                  placeholder="Örn:&#10;Yenilikçilik & Özgünlük: 0–30 puan&#10;Sunum Kalitesi: 0–20 puan&#10;Veri Desteği: 0–30 puan&#10;Zamanında Teslim: 0–20 puan"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Satır 5: Son Teslim Tarihi + Maks Puan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Son Teslim Tarihi <span className="text-red-400">★</span>
                  </label>
                  <input
                    id="gorev-tarih"
                    type="datetime-local"
                    value={gorevForm.son_teslim_tarihi}
                    onChange={e => setGorevForm(f => ({ ...f, son_teslim_tarihi: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maksimum Puan</label>
                  <input
                    id="gorev-maks-puan"
                    type="number" min="1" max="1000"
                    value={gorevForm.maksimum_puan}
                    onChange={e => setGorevForm(f => ({ ...f, maksimum_puan: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white rounded-b-3xl">
              <p className="text-xs text-gray-400">★ zorunlu alan</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setGorevModal(false); setGorevForm(GOREV_BOSH) }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all"
                >İptal</button>
                <button
                  id="btn-gorev-kaydet"
                  onClick={gorevOlustur}
                  disabled={savingGorev}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet to-purple-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {savingGorev
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor…</>
                    : <><Ic.Check c="w-3.5 h-3.5" />Görevi Kaydet</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ════ İÇE AKTAR MODAL ════ */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setImportModal(false); setImportResult(null) }} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">📥 Başvuruları İçe Aktar</h2>
                <p className="text-sm text-gray-400 mt-0.5">Google Forms verilerini sisteme yükle</p>
              </div>
              <button onClick={() => { setImportModal(false); setImportResult(null) }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <Ic.Close />
              </button>
            </div>

            {/* Tab Seçici */}
            <div className="flex border-b border-gray-100 px-8 pt-4 gap-1">
              {[
                { key: 'csv', label: '📄 CSV Dosyası', desc: 'Sheets\'ten indir, buraya yükle' },
                { key: 'url', label: '🔗 Sheets URL', desc: 'Public link ile direkt çek' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setImportTab(tab.key); setImportResult(null) }}
                  className={`flex flex-col items-start px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 ${
                    importTab === tab.key
                      ? 'border-violet text-violet bg-violet/5'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-normal text-gray-400 mt-0.5">{tab.desc}</span>
                </button>
              ))}
            </div>

            <div className="px-8 py-6 space-y-5">

              {/* Sonuç kutusu */}
              {importResult && (
                <div className={`rounded-2xl p-4 border text-sm space-y-2 ${
                  importResult.atlanan === importResult.toplam
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <p className="font-bold text-base">
                    {importResult.olusturulan + importResult.guncellenen > 0 ? '✅ Aktarım Tamamlandı!' : '⚠️ Hiçbir kayıt aktarılamadı'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-white/60 rounded-xl p-2 text-center">
                      <p className="text-xl font-bold text-emerald-700">{importResult.olusturulan}</p>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase">Yeni Eklendi</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-2 text-center">
                      <p className="text-xl font-bold text-blue-600">{importResult.guncellenen}</p>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase">Güncellendi</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-2 text-center">
                      <p className="text-xl font-bold text-amber-600">{importResult.atlanan}</p>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase">Atlandı</p>
                    </div>
                  </div>
                  {importResult.hatalar?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700">
                        {importResult.hatalar.length} uyarı/hata detayı →
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {importResult.hatalar.map((h, i) => <li key={i} className="font-mono bg-white/50 rounded px-2 py-1">{h}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {/* CSV Tab */}
              {importTab === 'csv' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1.5">
                    <p className="font-semibold">📋 Nasıl CSV indirilir?</p>
                    <ol className="text-xs space-y-1 text-blue-600 list-decimal list-inside">
                      <li>Google Sheets'i aç (form yanıtları sayfası)</li>
                      <li>Dosya → İndir → Virgülle ayrılmış değerler (.csv)</li>
                      <li>İndirilen dosyayı aşağıya sürükle veya seç</li>
                    </ol>
                  </div>

                  <label
                    htmlFor="import-csv-file"
                    className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      importFile
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-200 hover:border-violet/50 hover:bg-violet/5'
                    }`}
                  >
                    {importFile ? (
                      <div className="space-y-1">
                        <p className="text-2xl">📄</p>
                        <p className="font-semibold text-emerald-700 text-sm">{importFile.name}</p>
                        <p className="text-xs text-emerald-500">{(importFile.size / 1024).toFixed(1)} KB · Dosya hazır</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-3xl">⬆️</p>
                        <p className="text-sm font-medium text-gray-600">CSV dosyasını buraya sürükle</p>
                        <p className="text-xs text-gray-400">veya tıklayarak seç</p>
                      </div>
                    )}
                  </label>
                  <input
                    id="import-csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null) }}
                  />

                  <button
                    onClick={importCsv}
                    disabled={!importFile || importing}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet to-purple-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {importing
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Aktarılıyor…</>
                      : <>📥 CSV'yi İçe Aktar</>}
                  </button>
                </div>
              )}

              {/* Sheets URL Tab */}
              {importTab === 'url' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 space-y-1.5">
                    <p className="font-semibold">🔒 Önce sayfayı herkese aç!</p>
                    <ol className="text-xs space-y-1 text-amber-600 list-decimal list-inside">
                      <li>Google Sheets'te sağ üst Paylaş butonuna tıkla</li>
                      <li>«Bağlantıya sahip herkes» → Görüntüleyici olarak ayarla</li>
                      <li>URL'yi kopyala ve aşağıya yapıştır</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Google Sheets URL
                    </label>
                    <input
                      id="import-sheets-url-input"
                      type="url"
                      value={importUrl}
                      onChange={e => { setImportUrl(e.target.value); setImportResult(null) }}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all font-mono"
                    />
                    <p className="text-[11px] text-gray-400">
                      Sheets paylaşım linki, /edit veya /pub URL'si kabul edilir.
                    </p>
                  </div>

                  <button
                    onClick={importSheetsUrl}
                    disabled={!importUrl.trim() || importing}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet to-purple-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {importing
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Çekiliyor…</>
                      : <>🔗 URL'den Aktar</>}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════
   İÇERİK DNA TESTİ — İZOLE BÖLÜM
   Mevcut AdminPanel state/render'ına dokunmaz.
════════════════════════════════════════ */

const DNA_DURUM = {
  TASLAK:     { label: 'Taslak',     cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  GONDERILDI: { label: 'Gönderildi', cls: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  ISLENIYOR:  { label: 'İşleniyor',  cls: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-500 animate-ping' },
  TAMAMLANDI: { label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  HATA:       { label: 'Hata',       cls: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500' },
}

function DnaDurumBadge({ durum }) {
  const d = DNA_DURUM[durum] ?? { label: durum ?? '—', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${d.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
      {d.label}
    </span>
  )
}

// Gerçek 20 soruluk DNA form soruları (KatilimciPanel.jsx QUESTIONS array ile eşleşir)
const DNA_QUESTION_MAP = {
  soru_1:  'İçerik üretme amacın nedir?',
  soru_2:  'En çok hangi konularda içerik üretmek istiyorsun?',
  soru_3:  'İçeriklerini en çok hangi formatta üretmeyi düşünüyorsun?',
  soru_4:  'İçeriklerinde seni en iyi anlatan iletişim dili hangisi?',
  soru_5:  'Bir konuyu anlatırken en rahat hissettiğin video süresi hangisi?',
  soru_6:  'Kamera karşısındaki konuşma temponu nasıl tanımlarsın?',
  soru_7:  'Videolarına başlamayı en çok hangi şekilde seversin?',
  soru_8:  'Videonun sonunda izleyiciden beklediğin davranış nedir?',
  soru_9:  'Kamera karşısında kendini nasıl hissediyorsun? (1=Çok zorlanıyorum, 5=Çok rahatım)',
  soru_10: 'Bir video hazırlarken en çok zorlandığın konu nedir?',
  soru_11: 'Videolarında seni en çok hangi anlatım tarzı temsil eder?',
  soru_12: 'Video hazırlarken seni en çok motive eden şey nedir?',
  soru_13: 'Bir kriz anında (haksız eleştiri vb.) ilk tepkin ne olur?',
  soru_14: 'Haftada kaç içerik üretmeyi gerçekçi buluyorsun?',
  soru_15: 'Kendini içerik üretimi konusunda hangi seviyede görüyorsun?',
  soru_16: 'Hangi içerik üretici tarzına daha yakın olmak istersin?',
  soru_17: 'İçerik tarzını beğendiğin sağlık içerik üreticisi / hesap var mı?',
  soru_18: 'Kendi markanı yansıtacak en fazla 3 kelime nedir?',
  soru_19: 'İnsanların seni düşündüğünde akıllarına gelmesini istediğin en fazla 3 kelime nedir?',
  soru_20: 'Program sonunda insanların seni ve sayfanı tek cümleyle nasıl tanımlamasını istersin?',
}

// Kategori bilgisi (wizard adımlarıyla uyumlu)
const DNA_QUESTION_CATEGORIES = {
  soru_1:  { label: 'Amaç & Konular',        color: 'purple',  bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_2:  { label: 'Amaç & Konular',        color: 'purple',  bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_3:  { label: 'Amaç & Konular',        color: 'purple',  bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_4:  { label: 'Amaç & Konular',        color: 'purple',  bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  soru_5:  { label: "İçerik DNA'sı",         color: 'indigo',  bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_6:  { label: "İçerik DNA'sı",         color: 'indigo',  bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_7:  { label: "İçerik DNA'sı",         color: 'indigo',  bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_8:  { label: "İçerik DNA'sı",         color: 'indigo',  bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-200'  },
  soru_9:  { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_10: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_11: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_12: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_13: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_14: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_15: { label: 'Yetkinlik & Gelişim',   color: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  soru_16: { label: 'Arketip & Benchmark',   color: 'amber',   bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
  soru_17: { label: 'Arketip & Benchmark',   color: 'amber',   bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
  soru_18: { label: 'Marka Vizyonu',         color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  soru_19: { label: 'Marka Vizyonu',         color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  soru_20: { label: 'Marka Vizyonu',         color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
}

// Cevapları display için parse eder — [{key, index, questionTitle, category, answerText}]
const parseDnaAnswersForDisplay = (cevaplar) => {
  if (!cevaplar) return []
  let raw = cevaplar
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { raw = { cevap: raw } }
  }
  let entries = []
  if (Array.isArray(raw)) {
    entries = raw.map((v, idx) => [`soru_${idx + 1}`, v])
  } else if (typeof raw === 'object' && raw !== null) {
    // Önce soru_1..soru_20 sıralamasıyla, sonra diğer keyler
    const soruKeys = Object.keys(raw)
      .filter(k => /^soru_\d+$/.test(k))
      .sort((a, b) => parseInt(a.replace('soru_', '')) - parseInt(b.replace('soru_', '')))
    const otherKeys = Object.keys(raw).filter(k => !/^soru_\d+$/.test(k))
    entries = [...soruKeys, ...otherKeys].map(k => [k, raw[k]])
  }
  return entries.map(([k, v], idx) => {
    const questionTitle = DNA_QUESTION_MAP[k] || (String(k).startsWith('soru_') ? `Soru ${String(k).replace('soru_', '')}` : String(k).replace(/_/g, ' '))
    const soruNo = String(k).startsWith('soru_') ? parseInt(String(k).replace('soru_', '')) : null
    const cat = DNA_QUESTION_CATEGORIES[k] || { label: 'Diğer', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
    let answerText = ''
    if (Array.isArray(v)) { answerText = v.join(', ') }
    else if (typeof v === 'object' && v !== null) { answerText = JSON.stringify(v, null, 2) }
    else { answerText = String(v || '').trim() }
    return { key: k, index: idx, soruNo, questionTitle, category: cat, answerText }
  })
}

function DnaSection({ token, dnaList, setDnaList, dnaLoading, setDnaLoading, dnaError, setDnaError, dnaDetail, setDnaDetail, dnaRegen, setDnaRegen, setToast }) {

  const fetchList = async () => {
    setDnaLoading(true)
    setDnaError(null)
    try {
      const data = await getAdminIcerikDnaList()
      setDnaList(data || [])
    } catch (e) {
      setDnaError(`Liste yüklenemedi: ${e.message}`)
    } finally {
      setDnaLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const openDetail = (item) => {
    setDnaDetail(item)
  }

  const regenerate = async (id) => {
    setToast({ msg: 'İçerik DNA raporu katılımcı gönderimi sırasında otomatik üretilmektedir.', type: 'info' })
  }

  const handleCleanDnaTests = async () => {
    if (!window.confirm('Tüm katılımcı DNA test kayıtlarını silmek istediğinize emin misiniz? Katılımcılar testlerini yeni prompt ile baştan doldurabileceklerdir.')) {
      return
    }
    setDnaLoading(true)
    try {
      await callAdminAction('clean_dna_tests')
      setDnaDetail(null)
      await fetchList()
      alert('Tüm DNA test kayıtları başarıyla sıfırlandı.')
    } catch (e) {
      alert(`Hata: ${e.message}`)
    } finally {
      setDnaLoading(false)
    }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
  const detailKatName = dnaDetail ? (dnaDetail.katilimci_ad_soyad || dnaDetail.katilimci_adi || 'Katılımcı') : 'Katılımcı'

  return (
    <div className="space-y-6">

      {/* Hata */}
      {dnaError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm">
          <span>⚠️</span><span>{dnaError}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── İÇERİK DNA TESTLERİ ── */}
      {!dnaDetail ? (
        /* ── LİSTE GÖRÜNÜMÜ (TAM EKRAN / TAM GENİŞLİK) ── */
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden w-full">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🧬</span>
              <h3 className="text-sm font-bold text-gray-800">İçerik DNA Analizleri Listesi</h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {dnaList.length > 0 && (
                <button
                  onClick={handleCleanDnaTests}
                  disabled={dnaLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all disabled:opacity-50"
                  title="Tüm DNA kayıtlarını siler ve yeni promptla sıfırdan test edilmesine olanak tanır."
                >
                  <span>🗑️</span>
                  <span>Tümünü Sıfırla</span>
                </button>
              )}
              <button
                onClick={fetchList}
                disabled={dnaLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 transition-all disabled:opacity-50"
              >
                <span className={dnaLoading ? 'animate-spin inline-block' : 'inline-block'}>
                  <Ic.Refresh c="w-3.5 h-3.5" />
                </span>
                Yenile
              </button>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {dnaLoading ? 'Yükleniyor…' : `${dnaList.length} Kayıt`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['#', 'Katılımcı', 'Takım', 'Durum', 'Gönderim Tarihi', 'AI Model', 'İşlem'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dnaLoading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                  : dnaList.length === 0
                  ? (
                    <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🧬</span>
                        <p className="font-semibold text-gray-700">Henüz İçerik DNA testi gönderilmemiş.</p>
                        <p className="text-xs text-gray-400">Katılımcılar testi tamamladıkça raporlar burada görünecektir.</p>
                      </div>
                    </td></tr>
                  )
                  : dnaList.map((item, idx) => {
                    const itemKatName = item.katilimci_ad_soyad || item.katilimci_adi || 'Katılımcı'
                    const tName = item.takim_adi || '—'
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 transition-colors duration-150 hover:bg-gray-50/80"
                      >
                        <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-200 to-indigo-100 flex items-center justify-center flex-shrink-0 text-purple-700 font-bold text-xs">
                              {itemKatName[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 block whitespace-nowrap">{itemKatName}</span>
                              {item.katilimci_eposta && <span className="text-[10px] text-gray-400 block">{item.katilimci_eposta}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                          {tName !== '—' ? <span className="bg-purple-50 text-purple-700 border border-purple-200/70 font-semibold px-2 py-0.5 rounded-md">{tName}</span> : <span className="text-gray-400 italic">Takımsız</span>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap"><DnaDurumBadge durum={item.durum} /></td>
                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{fmtDate(item.gonderim_tarihi)}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap font-mono">{item.ai_model || '—'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            id={`btn-dna-detail-${item.id}`}
                            onClick={() => openDetail(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/70 transition-all shadow-2xs"
                          >
                            <Ic.Eye c="w-3.5 h-3.5" /> Detayı Gör
                          </button>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── DETAY GÖRÜNÜMÜ (TAM EKRAN / TAM GENİŞLİK) ── */
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden w-full flex flex-col space-y-6 p-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 bg-purple-50/50 -mx-6 -mt-6 p-6">
            <div className="flex items-center gap-3">
              <button
                id="btn-close-dna-detail"
                onClick={() => setDnaDetail(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 shadow-2xs transition-all flex-shrink-0"
              >
                <Ic.Close c="w-3.5 h-3.5 text-gray-500" />
                <span>← Analiz Listesine Dön</span>
              </button>

              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-2xs flex-shrink-0">
                {detailKatName[0].toUpperCase()}
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-base leading-snug truncate">{detailKatName}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {dnaDetail.katilimci_eposta ? `${dnaDetail.katilimci_eposta} · ` : ''}
                  <span className="font-semibold text-gray-700">{dnaDetail.takim_adi || 'Takımsız'}</span>
                  {dnaDetail.universite ? ` · ${dnaDetail.universite}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                id={`btn-dna-regen-${dnaDetail.id}`}
                onClick={() => regenerate(dnaDetail.id)}
                disabled={dnaRegen === dnaDetail.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {dnaRegen === dnaDetail.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>İşleniyor…</span>
                  </>
                ) : (
                  <>
                    <Ic.Refresh c="w-3.5 h-3.5" />
                    <span>Raporu Yeniden Oluştur</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Özet Kartları Barı */}
          {(() => {
            const parsedAnswers = parseDnaAnswersForDisplay(dnaDetail?.cevaplar)

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">Katılımcı & Takım</span>
                    <p className="text-sm font-extrabold text-purple-900 mt-0.5 truncate">{detailKatName}</p>
                    <span className="text-[10px] text-purple-600 font-semibold">{dnaDetail.takim_adi || 'Takımsız'}</span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Test Durumu</span>
                    <div className="mt-1 flex justify-center"><DnaDurumBadge durum={dnaDetail.durum} /></div>
                    <span className="text-[10px] text-gray-500 block mt-1">{fmtDate(dnaDetail.gonderim_tarihi)}</span>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">AI Modeli</span>
                    <p className="text-xs font-bold text-blue-900 font-mono mt-1">{dnaDetail.ai_model || '—'}</p>
                    <span className="text-[10px] text-blue-600 block">Prompt {dnaDetail.prompt_versiyonu || 'v1'}</span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Cevaplanan Soru</span>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{parsedAnswers.length}</p>
                    <span className="text-[10px] text-slate-500 block">/ 20 Soru</span>
                  </div>
                </div>


                {/* Katılımcı Cevapları — Kategorili Kartlar */}
                {(() => {
                  const parsedAnswers = parseDnaAnswersForDisplay(dnaDetail.cevaplar)
                  if (parsedAnswers.length === 0) {
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500 italic flex items-center gap-2">
                        <span>💬</span> Bu kayıt için cevap verisi bulunamadı veya okunamadı.
                      </div>
                    )
                  }
                  return (
                    <div className="bg-gray-50/50 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-base">💬</span>
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Katılımcı Cevapları</h4>
                        </div>
                        <span className="text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full">
                          {parsedAnswers.length} / 20 Soru Cevaplandı
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {parsedAnswers.map((item) => (
                          <div
                            key={item.key}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-2.5 transition-all hover:border-purple-200 hover:shadow-soft"
                          >
                            {/* Soru numarası + kategori rozeti */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {item.soruNo && (
                                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md tabular-nums">
                                  #{item.soruNo}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.category.bg} ${item.category.text} ${item.category.border}`}>
                                {item.category.label}
                              </span>
                            </div>
                            {/* Soru başlığı */}
                            <p className="text-[11px] font-extrabold text-gray-700 leading-snug">
                              {item.questionTitle}
                            </p>
                            {/* Cevap */}
                            <p className="text-xs text-gray-800 leading-relaxed break-words font-medium whitespace-pre-wrap border-t border-gray-100 pt-2">
                              {item.answerText || <span className="italic text-gray-400">Cevap verilmedi.</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* AI Raporu & Dashboard */}
                {dnaDetail.rapor_metni ? (
                  <div className="space-y-4">
                    <DnaReportRenderer
                      reportText={dnaDetail.rapor_metni}
                      aiModel={dnaDetail.ai_model}
                      promptVersion={dnaDetail.prompt_versiyonu}
                      answers={dnaDetail.cevaplar}
                      katilimciAdi={detailKatName}
                      takimAdi={dnaDetail.takim_adi}
                      gonderimTarihi={dnaDetail.gonderim_tarihi}
                      isAdmin={true}
                    />
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 flex items-center gap-2">
                    <span>ℹ️</span> Bu kayıt için henüz AI rapor metni oluşturulmamış.
                  </div>
                )}

                {/* Teknik JSON (Debug) */}
                {dnaDetail.rapor_json && Object.keys(dnaDetail.rapor_json).length > 0 && (
                  <details className="group border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                    <summary className="px-4 py-3 text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-100 flex items-center justify-between select-none">
                      <span className="flex items-center gap-2">
                        <span>🛠️</span>
                        <span>Teknik JSON (Debug)</span>
                      </span>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">▼</span>
                    </summary>
                    <div className="p-4 border-t border-gray-200 bg-slate-900 text-emerald-400 rounded-b-xl">
                      <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto max-h-60 overflow-y-auto">
                        {JSON.stringify(dnaDetail.rapor_json, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            )
          })()}
        </div>
      )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   KATILIMCI PERFORMANS SEKMESİ
════════════════════════════════════════ */
function PerformansSection({ token, setToast }) {
  const [performansList, setPerformansList] = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [search, setSearch]                 = useState('')
  const [selectedKatilimciId, setSelectedKatilimciId] = useState(null)
  const [detail, setDetail]                 = useState(null)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [activeTab, setActiveTab]           = useState('puanlar') // 'puanlar' | 'toplanti' | 'sosyal' | 'teslimler'

  // Score Form
  const [scoreForm, setScoreForm] = useState({
    gorev_puani: 0,
    toplanti_katilim_puani: 0,
    etkilesim_bonus_puani: 0,
    manuel_puan: 0,
    admin_ici_not: '',
    katilimciya_gorunen_not: '',
  })
  const [savingScore, setSavingScore] = useState(false)

  // Toplantı Form
  const [toplantiForm, setToplantiForm] = useState({
    baslik: '',
    tarih: new Date().toISOString().split('T')[0],
    katildi_mi: true,
    katilim_puani: 10,
    not_metni: '',
  })
  const [savingToplanti, setSavingToplanti] = useState(false)

  // Sosyal Medya Form
  const [sosyalForm, setSosyalForm] = useState({
    platform: 'Instagram',
    takipci_sayisi: 0,
    etkilesim_sayisi: 0,
    bonus_puan: 5,
    not_metni: '',
  })
  const [savingSosyal, setSavingSosyal]     = useState(false)
  const [deletingToplanti, setDeletingToplanti] = useState(null)
  const [deletingSosyal, setDeletingSosyal]     = useState(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminPerformansList()
      setPerformansList(data || [])
    } catch (e) {
      setError(`Performans verileri yüklenemedi: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const fetchDetail = async (katilimciId, baseRow = null) => {
    if (!katilimciId) return
    setSelectedKatilimciId(katilimciId)
    setDetailLoading(true)
    try {
      const baseItem = baseRow || (performansList || []).find(p => Number(p.katilimci_id || p.katilimci || p.id) === Number(katilimciId)) || null

      const [item, kDetay, tList, sList, tesList, aList] = await Promise.all([
        baseItem || (performansList || []).find(p => Number(p.katilimci_id || p.katilimci || p.id) === Number(katilimciId)) || null,
        getAdminKatilimciDetay(katilimciId).catch(() => null),
        getAdminKatilimciToplantilari(katilimciId).catch(() => []),
        getAdminKatilimciSosyalMedya(katilimciId).catch(() => []),
        getAdminKatilimciTeslimleri(katilimciId).catch(() => []),
        getAdminKatilimciAktiviteLoglari(katilimciId, 10).catch(() => [])
      ])

      const perfItem = item || {
        katilimci_id: katilimciId,
        ad_soyad: kDetay?.ad_soyad || baseItem?.ad_soyad || 'Katılımcı',
        gorev_puani: 0,
        toplanti_katilim_puani: 0,
        etkilesim_bonus_puani: 0,
        manuel_puan: 0,
        bireysel_puan: 0,
        admin_ici_not: '',
        katilimciya_gorunen_not: ''
      }

      const katilimciInfo = {
        id: katilimciId,
        ad_soyad: kDetay?.ad_soyad || perfItem.ad_soyad || baseItem?.ad_soyad || `${baseItem?.ad || ''} ${baseItem?.soyad || ''}`.trim() || 'Katılımcı',
        eposta: kDetay?.eposta || perfItem.eposta || baseItem?.eposta || '',
        telefon: kDetay?.telefon || perfItem.telefon || baseItem?.telefon || '',
        universite: kDetay?.universite || perfItem.universite || baseItem?.universite || '',
        sinif: kDetay?.sinif || perfItem.sinif || baseItem?.sinif || '',
        adres: kDetay?.adres || perfItem.adres || baseItem?.adres || '',
        okul_bilgisi: kDetay?.okul_bilgisi || perfItem.okul_bilgisi || baseItem?.okul_bilgisi || '',
        egitim_durumu: kDetay?.egitim_durumu || perfItem.egitim_durumu || baseItem?.egitim_durumu || '',
        is_durumu: kDetay?.is_durumu || perfItem.is_durumu || baseItem?.is_durumu || '',
        calistigi_kurum: kDetay?.calistigi_kurum || perfItem.calistigi_kurum || baseItem?.calistigi_kurum || '',
        pozisyon: kDetay?.pozisyon || perfItem.pozisyon || baseItem?.pozisyon || '',
        is_aciklamasi: kDetay?.is_aciklamasi || perfItem.is_aciklamasi || baseItem?.is_aciklamasi || '',
        profil_fotografi_url: kDetay?.profil_fotografi_url || perfItem.profil_fotografi_url || baseItem?.profil_fotografi_url || '',
        profil_fotografi_file_id: kDetay?.profil_fotografi_file_id || perfItem.profil_fotografi_file_id || baseItem?.profil_fotografi_file_id || '',
        profil_guncelleme_tarihi: kDetay?.profil_guncelleme_tarihi || perfItem.profil_guncelleme_tarihi || baseItem?.profil_guncelleme_tarihi || null,
        ilk_giris_tarihi: kDetay?.ilk_giris_tarihi || perfItem.ilk_giris_tarihi || baseItem?.ilk_giris_tarihi || null,
        son_giris_tarihi: kDetay?.son_giris_tarihi || perfItem.son_giris_tarihi || baseItem?.son_giris_tarihi || null,
        son_aktivite_tarihi: kDetay?.son_aktivite_tarihi || perfItem.son_aktivite_tarihi || baseItem?.son_aktivite_tarihi || null,
        giris_sayisi: Number(kDetay?.giris_sayisi ?? perfItem.giris_sayisi ?? baseItem?.giris_sayisi ?? 0),
        takim_adi: kDetay?.takim_adi || perfItem.takim_adi || baseItem?.takim_adi || 'Takımsız',
        program_katilim_durumu: 'AKTIF'
      }

      setDetail({
        katilimci: katilimciInfo,
        performans: perfItem,
        toplanti_katilimlari: tList || [],
        sosyal_medya: sList || [],
        sosyal_medya_performanslari: sList || [],
        teslimler: tesList || [],
        aktivite_loglari: aList || []
      })

      setScoreForm({
        gorev_puani: Number(perfItem.gorev_puani) || 0,
        toplanti_katilim_puani: Number(perfItem.toplanti_katilim_puani) || 0,
        etkilesim_bonus_puani: Number(perfItem.etkilesim_bonus_puani) || 0,
        manuel_puan: Number(perfItem.manuel_puan) || 0,
        admin_ici_not: String(perfItem.admin_ici_not || ''),
        katilimciya_gorunen_not: String(perfItem.katilimciya_gorunen_not || ''),
      })
    } catch (e) {
      setToast({ msg: `Detay yüklenemedi: ${e.message}`, type: 'error' })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleScoreSave = async () => {
    if (!selectedKatilimciId || savingScore) return
    setSavingScore(true)
    try {
      await updateAdminPerformansScore(selectedKatilimciId, scoreForm)
      await fetchList()
      await fetchDetail(selectedKatilimciId)
      setToast({ msg: 'Performans puanları güncellendi!', type: 'success' })
    } catch (e) {
      setToast({ msg: `Güncelleme başarısız: ${e.message}`, type: 'error' })
    } finally {
      setSavingScore(false)
    }
  }

  const handleToplantiSubmit = async (e) => {
    e.preventDefault()
    if (!selectedKatilimciId || !String(toplantiForm.baslik || '').trim() || savingToplanti) return
    setSavingToplanti(true)
    try {
      await addAdminToplantiKatilimi(selectedKatilimciId, toplantiForm)
      setToplantiForm({
        baslik: '',
        tarih: new Date().toISOString().split('T')[0],
        katildi_mi: true,
        katilim_puani: 10,
        not_metni: '',
      })
      await fetchList()
      await fetchDetail(selectedKatilimciId)
      setToast({ msg: 'Toplantı katılımı eklendi!', type: 'success' })
    } catch (e) {
      setToast({ msg: `Toplantı ekleme hatası: ${e.message}`, type: 'error' })
    } finally {
      setSavingToplanti(false)
    }
  }

  const handleToplantiDelete = async (toplantiId) => {
    if (!selectedKatilimciId || !window.confirm('Bu toplantı kaydını silmek istediğinize emin misiniz?')) return
    setDeletingToplanti(toplantiId)
    try {
      await deleteAdminToplantiKatilimi(toplantiId, selectedKatilimciId)
      await fetchList()
      await fetchDetail(selectedKatilimciId)
      setToast({ msg: 'Toplantı kaydı silindi ve puanlar güncellendi.', type: 'success' })
    } catch (e) {
      setToast({ msg: `Silme hatası: ${e.message}`, type: 'error' })
    } finally {
      setDeletingToplanti(null)
    }
  }

  const handleSosyalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedKatilimciId || !String(sosyalForm.platform || '').trim() || savingSosyal) return
    setSavingSosyal(true)
    try {
      await addAdminSosyalMedya(selectedKatilimciId, sosyalForm)
      setSosyalForm({ platform: 'Instagram', takipci_sayisi: 0, etkilesim_sayisi: 0, bonus_puan: 5, not_metni: '' })
      await fetchList()
      await fetchDetail(selectedKatilimciId)
      setToast({ msg: 'Sosyal medya performansı eklendi!', type: 'success' })
    } catch (e) {
      setToast({ msg: `Sosyal medya ekleme hatası: ${e.message}`, type: 'error' })
    } finally {
      setSavingSosyal(false)
    }
  }

  const handleSosyalDelete = async (sosyalId) => {
    if (!selectedKatilimciId || !window.confirm('Bu sosyal medya kaydını silmek istediğinize emin misiniz?')) return
    setDeletingSosyal(sosyalId)
    try {
      await deleteAdminSosyalMedya(sosyalId, selectedKatilimciId)
      await fetchList()
      await fetchDetail(selectedKatilimciId)
      setToast({ msg: 'Sosyal medya kaydı silindi ve puanlar güncellendi.', type: 'success' })
    } catch (e) {
      setToast({ msg: `Silme hatası: ${e.message}`, type: 'error' })
    } finally {
      setDeletingSosyal(null)
    }
  }

  const safePerformansList = Array.isArray(performansList) ? performansList : []
  const searchQuery = String(search || '').toLowerCase()

  const filtered = safePerformansList.filter(p => {
    if (!p || typeof p !== 'object') return false
    const kAdi = String(p.ad_soyad || p.katilimci_adi || '')
    const tAdi = String(p.takim_adi || '')
    return kAdi.toLowerCase().includes(searchQuery) || tAdi.toLowerCase().includes(searchQuery)
  })

  const calcLiveTotal = Math.max(
    0,
    (Number(scoreForm.gorev_puani) || 0) +
    (Number(scoreForm.toplanti_katilim_puani) || 0) +
    (Number(scoreForm.etkilesim_bonus_puani) || 0) +
    (Number(scoreForm.manuel_puan) || 0)
  )

  // Güvenli Array Tanımları
  const toplantiKatilimlari = Array.isArray(detail?.toplanti_katilimlari) ? detail.toplanti_katilimlari : []
  const sosyalMedyaList     = Array.isArray(detail?.sosyal_medya_performanslari) ? detail.sosyal_medya_performanslari : []
  const teslimlerList       = Array.isArray(detail?.teslimler) ? detail.teslimler : []
  const aktiviteLoglari     = Array.isArray(detail?.aktivite_loglari) ? detail.aktivite_loglari : []

  // Güvenli Katılımcı ve Performans Nesneleri
  const katilimciObj = detail?.katilimci && typeof detail.katilimci === 'object' ? detail.katilimci : {}
  const performansObj = detail?.performans && typeof detail.performans === 'object' ? detail.performans : {}

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && detail) {
        setDetail(null)
        setSelectedKatilimciId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detail])

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* ─── KATILIMCI ETKİLEŞİM & GİRİŞ ÖZETİ KARTLARI ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-soft">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Toplam Katılımcı</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-800">{safePerformansList.length}</span>
            <span className="text-xs text-gray-500 font-semibold">
              ({safePerformansList.filter(p => p.program_katilim_durumu === 'AKTIF').length} Aktif, {safePerformansList.filter(p => p.program_katilim_durumu === 'PASIF').length} Pasif)
            </span>
          </div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-soft">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Giriş Yapan Katılımcılar</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">
              {safePerformansList.filter(p => (Number(p.giris_sayisi) > 0) || Boolean(p.son_giris_tarihi)).length}
            </span>
            <span className="text-xs font-semibold text-emerald-700">/ {safePerformansList.length}</span>
          </div>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-soft">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Henüz Giriş Yapmayan</span>
          <span className="text-2xl font-black text-amber-900">
            {safePerformansList.filter(p => (!p.giris_sayisi || Number(p.giris_sayisi) === 0) && !p.son_giris_tarihi).length}
          </span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-soft">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Bugün Aktif Olan</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-900">
              {safePerformansList.filter(p => p.son_aktivite_tarihi && (new Date(p.son_aktivite_tarihi).toDateString() === new Date().toDateString())).length}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* LİSTE GÖRÜNÜMÜ (HER ZAMAN TAM GENİŞLİK) */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden w-full">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800">Katılımcı Performans & Giriş Listesi</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full">
              {filtered.length} kişi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchList}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 transition-all disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>
                <Ic.Refresh c="w-3.5 h-3.5" />
              </span>
              Yenile
            </button>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">🔍</span>
              <input
                id="perf-search-input"
                type="text"
                placeholder="Katılımcı veya takım ara…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/50 w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {['#', 'Katılımcı', 'Takım', 'Giriş / Aktivite Durumu', 'Bireysel Puan', 'Puan Dağılımı', 'İşlem'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">⭐</span>
                        <p className="font-semibold text-gray-700">Henüz performans kaydı bulunmuyor.</p>
                      </div>
                    </td>
                  </tr>
                )
                : filtered.map((item, idx) => {
                  if (!item || typeof item !== 'object') return null
                  const targetId = item.katilimci || item.id
                  const isSelected = selectedKatilimciId === targetId
                  const kAdi = String(item.ad_soyad || item.katilimci_adi || 'Bilinmeyen Katılımcı')
                  const tAdi = item.takim_adi ? String(item.takim_adi) : null
                  const birPuan = Number(item.bireysel_puan) || 0
                  const gPuan = Number(item.gorev_puani) || 0
                  const tPuan = Number(item.toplanti_katilim_puani) || 0
                  const ePuan = Number(item.etkilesim_bonus_puani) || 0
                  const mPuan = Number(item.manuel_puan) || 0

                  return (
                    <tr
                      key={item.id || idx}
                      className={`border-t border-gray-100 transition-colors duration-150 ${
                        isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {getParticipantAvatarSrc(item) ? (
                            <img
                              src={getParticipantAvatarSrc(item, 80)}
                              alt={kAdi}
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-300 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-orange-100 flex items-center justify-center flex-shrink-0 text-amber-800 font-bold text-xs">
                              {kAdi[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-800 whitespace-nowrap">{kAdi}</span>
                              {item.program_katilim_durumu === 'PASIF' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Pasif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                        {tAdi ? <span className="bg-violet-50 text-violet border border-violet/20 font-semibold px-2 py-0.5 rounded-md">{tAdi}</span> : <span className="text-gray-400 italic">Takımsız</span>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {(() => {
                          const hasLoggedIn = (Number(item.giris_sayisi) > 0) || Boolean(item.son_giris_tarihi)
                          const isToday = item.son_aktivite_tarihi && (new Date(item.son_aktivite_tarihi).toDateString() === new Date().toDateString())
                          const girisSayisi = Number(item.giris_sayisi) || 0

                          if (!hasLoggedIn) {
                            return (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Henüz Giriş Yok
                              </span>
                            )
                          }

                          const sonGirisFormatted = item.son_giris_tarihi
                            ? new Date(item.son_giris_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'

                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                {isToday ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Bugün Aktif
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Giriş Yaptı ({girisSayisi} kez)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">
                                Son: {sonGirisFormatted}
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs shadow-2xs">
                          <Ic.Star c="w-3.5 h-3.5 text-amber-500" />
                          {birPuan} puan
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span title="Görev Puanı" className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">G: {gPuan}</span>
                          <span title="Toplantı Puanı" className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">T: {tPuan}</span>
                          <span title="Etkileşim Bonusu" className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">E: {ePuan}</span>
                          <span title="Manuel Puan" className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">M: {mPuan}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          id={`btn-perf-detail-${targetId}`}
                          onClick={() => fetchDetail(targetId, item)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          <Ic.Eye c="w-3.5 h-3.5" /> Detay Gör
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* GENİŞ / TAM PANEL PERFORMANS DETAY MODAL                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-7xl h-[94vh] max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-up">
            
            {/* 1. STICKY MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  id="btn-close-perf-detail"
                  onClick={() => { setDetail(null); setSelectedKatilimciId(null) }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 shadow-2xs transition-all flex-shrink-0"
                  title="Listeye Geri Dön (ESC)"
                >
                  <Ic.Close c="w-4 h-4 text-gray-500" />
                  <span className="hidden sm:inline">Listeye Dön</span>
                </button>

                {(() => {
                  const kName = String(katilimciObj.ad_soyad || katilimciObj.katilimci_ad_soyad || performansObj.ad_soyad || 'Bilinmeyen Katılımcı').trim()
                  const kInitial = kName !== 'Bilinmeyen Katılımcı' && kName.length > 0 ? kName[0].toUpperCase() : '?'
                  const tName = katilimciObj.takim_adi || katilimciObj.takim || performansObj.takim_adi || 'Takımsız'
                  const email = katilimciObj.eposta || performansObj.eposta || ''
                  const uni = katilimciObj.universite || performansObj.universite || ''
                  const sinif = katilimciObj.sinif || performansObj.sinif || ''
                  const isPasif = katilimciObj.program_katilim_durumu === 'PASIF'

                  return (
                    <>
                      {getParticipantAvatarSrc(katilimciObj) ? (
                        <a
                          href={katilimciObj.profil_fotografi_url || getParticipantAvatarSrc(katilimciObj)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Fotoğrafı tam boyutta aç"
                          className="shrink-0 group relative"
                        >
                          <img
                            src={getParticipantAvatarSrc(katilimciObj, 120)}
                            alt={kName}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-300 shadow-xs group-hover:scale-105 transition-all"
                          />
                        </a>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-black text-lg shadow-xs flex-shrink-0">
                          {kInitial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-gray-800 text-base leading-snug truncate">{kName}</h3>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            Katılımcı #{katilimciObj.id || selectedKatilimciId}
                          </span>
                          {isPasif ? (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                              🔒 Pasif / Ayrıldı
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              🟢 Aktif Katılımcı
                            </span>
                          )}
                          {tName && tName !== 'Takımsız' && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              🏆 {tName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {email ? <span className="font-mono text-[11px]">{email} · </span> : ''}
                          {uni ? <span>{uni}{sinif ? ` (${sinif}. Sınıf)` : ''}</span> : ''}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Pasife Al / Aktifleştir Güvenli Buton */}
                {(() => {
                  const kName = String(katilimciObj.ad_soyad || katilimciObj.katilimci_ad_soyad || performansObj.ad_soyad || 'Katılımcı').trim()
                  const email = katilimciObj.eposta || performansObj.eposta || ''
                  const isPasif = katilimciObj.program_katilim_durumu === 'PASIF'

                  return (
                    <button
                      id="btn-toggle-passivate"
                      onClick={async () => {
                        const confirmMsg = isPasif
                          ? `Bu katılımcıyı (${kName}) tekrar AKTİF duruma getirmek istiyor musunuz?`
                          : `Bu katılımcıyı (${kName}) PASİFE almak istiyor musunuz? Hiçbir veri silinmeyecek, kayıtlar korunacaktır.`
                        if (!window.confirm(confirmMsg)) return
                        try {
                          if (isPasif) {
                            await activateParticipant({ katilimci_id: selectedKatilimciId, email })
                            setToast({ msg: `${kName} yeniden aktifleştirildi! 🟢`, type: 'success' })
                          } else {
                            await passivateParticipant({ katilimci_id: selectedKatilimciId, email, reason: 'Admin panelinden pasife alındı' })
                            setToast({ msg: `${kName} pasife alındı (Veriler korundu). 🔒`, type: 'info' })
                          }
                          await loadPerformans()
                          if (selectedKatilimciId) {
                            const freshDetay = await getAdminKatilimciDetay(selectedKatilimciId)
                            if (freshDetay) {
                              setDetail(prev => ({ ...prev, katilimci: freshDetay }))
                            }
                          }
                        } catch (err) {
                          setToast({ msg: `İşlem başarısız: ${err.message}`, type: 'error' })
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                        isPasif
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isPasif ? '🟢 Aktifleştir' : '🔒 Pasife Al'}
                    </button>
                  )
                })()}

                <div className="text-right bg-white/90 px-4 py-1.5 rounded-2xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Bireysel Puan</span>
                  <span className="text-xl font-black text-amber-900 tabular-nums">
                    {Number(performansObj.bireysel_puan) || 0} <span className="text-xs font-bold text-amber-600">puan</span>
                  </span>
                </div>
                <button
                  onClick={() => { setDetail(null); setSelectedKatilimciId(null) }}
                  className="p-2.5 rounded-2xl bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 border border-gray-200 transition-colors shadow-2xs"
                  title="Kapat (ESC)"
                >
                  <Ic.Close c="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. DETAY SEKME BUTONLARI */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 px-6 gap-2 overflow-x-auto flex-shrink-0">
              {[
                { key: 'profil', label: '👤 Profil Detayları' },
                { key: 'aktivite', label: `📊 Giriş & Aktivite (${aktiviteLoglari.length})` },
                { key: 'puanlar', label: '⭐ Puan Düzenle & Notlar' },
                { key: 'toplanti', label: `📅 Toplantılar (${toplantiKatilimlari.length})` },
                { key: 'sosyal', label: `📱 Sosyal Medya (${sosyalMedyaList.length})` },
                { key: 'teslimler', label: `📋 Teslimler (${teslimlerList.length})` },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === t.key
                      ? 'border-amber-500 text-amber-900 bg-white shadow-2xs'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 3. SCROLLABLE TAB CONTENT */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {detailLoading && (
                <div className="py-16 text-center text-gray-400 animate-pulse text-sm">Katılımcı detay verileri yükleniyor…</div>
              )}

              {/* ─── TAB 1: PROFİL DETAYLARI ─── */}
              {!detailLoading && activeTab === 'profil' && (
                <div className="space-y-6">
                  {/* Profil Başlık & Fotoğraf */}
                  <div className="bg-gradient-to-r from-orange-50 via-amber-50/70 to-pink-50/50 border border-amber-200/80 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
                    {getParticipantAvatarSrc(katilimciObj) ? (
                      <a
                        href={katilimciObj.profil_fotografi_url || getParticipantAvatarSrc(katilimciObj)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Orijinal fotoğrafı görüntüle"
                        className="group relative shrink-0"
                      >
                        <img
                          src={getParticipantAvatarSrc(katilimciObj, 400)}
                          alt={katilimciObj.ad_soyad}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-amber-300 shadow-md group-hover:scale-105 transition-all"
                        />
                        <span className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          Büyüt ↗
                        </span>
                      </a>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-3xl shadow-md shrink-0">
                        {(katilimciObj.ad_soyad || '?')[0]?.toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                        <h4 className="font-black text-gray-800 text-xl tracking-tight">{katilimciObj.ad_soyad}</h4>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                          Katılımcı #{katilimciObj.id}
                        </span>
                        {katilimciObj.takim_adi && (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full border border-purple-200">
                            🏆 {katilimciObj.takim_adi}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500 justify-center sm:justify-start">
                        <span className="font-mono">✉️ {katilimciObj.eposta || '—'}</span>
                        <span>•</span>
                        <span>📞 {katilimciObj.telefon || <span className="italic">Telefon belirtilmemiş</span>}</span>
                        <span>•</span>
                        <span>🎓 {katilimciObj.universite || 'Üniversite belirtilmemiş'}</span>
                      </div>
                      {katilimciObj.profil_guncelleme_tarihi && (
                        <p className="text-[11px] text-gray-400 pt-1">
                          Son Profil Güncellemesi: {new Date(katilimciObj.profil_guncelleme_tarihi).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4 Kolonlu Detay Kartları */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {/* Giriş & Aktivite Özeti */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🔐</span> Platform Erişim & Giriş
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Giriş Durumu</span>
                          {Number(katilimciObj.giris_sayisi) > 0 || katilimciObj.son_giris_tarihi ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Giriş Yaptı ({Number(katilimciObj.giris_sayisi) || 0} kez)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Henüz Giriş Yok
                            </span>
                          )}
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">İlk Giriş Tarihi</span>
                          <span className="font-mono text-gray-800 text-xs">
                            {katilimciObj.ilk_giris_tarihi ? new Date(katilimciObj.ilk_giris_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Son Giriş Tarihi</span>
                          <span className="font-mono text-gray-800 text-xs">
                            {katilimciObj.son_giris_tarihi ? new Date(katilimciObj.son_giris_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Son Aktivite Zamanı</span>
                          <span className="font-mono text-gray-800 text-xs">
                            {katilimciObj.son_aktivite_tarihi ? new Date(katilimciObj.son_aktivite_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* İletişim & Adres */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📍</span> İletişim & Gönderim Adresi
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Telefon Numarası</span>
                          <span className="font-semibold text-gray-800 text-xs">{katilimciObj.telefon || 'Belirtilmemiş'}</span>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">E-Posta Adresi</span>
                          <span className="font-mono text-gray-800 text-xs">{katilimciObj.eposta || '—'}</span>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3.5 text-xs text-gray-700 leading-relaxed">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Açık İkamet / Gönderim Adresi</span>
                          {katilimciObj.adres && String(katilimciObj.adres).trim() ? (
                            <p className="whitespace-pre-line text-xs">{katilimciObj.adres}</p>
                          ) : (
                            <p className="text-gray-400 italic">Adres bilgisi henüz girilmedi.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Eğitim & Okul */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎓</span> Eğitim & Okul Bilgileri
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Üniversite</span>
                            <span className="font-semibold text-gray-800 text-xs">{katilimciObj.universite || '—'}</span>
                          </div>
                          <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Sınıf</span>
                            <span className="font-semibold text-gray-800 text-xs">{katilimciObj.sinif || '—'}</span>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Eğitim Durumu</span>
                          <span className="font-semibold text-gray-800 text-xs">
                            {katilimciObj.egitim_durumu ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                                {katilimciObj.egitim_durumu}
                              </span>
                            ) : '—'}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3.5 text-xs text-gray-700">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Okul & Bölüm Tam Bilgileri</span>
                          {katilimciObj.okul_bilgisi && String(katilimciObj.okul_bilgisi).trim() ? (
                            <p className="whitespace-pre-line text-xs">{katilimciObj.okul_bilgisi}</p>
                          ) : (
                            <p className="text-gray-400 italic">Detaylı okul bilgisi girilmedi.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* İş & Kariyer */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>💼</span> İş & Kariyer Durumu
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">İş Durumu</span>
                          <span className="font-semibold text-gray-800 text-xs">
                            {katilimciObj.is_durumu ? (
                              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-100">
                                {katilimciObj.is_durumu}
                              </span>
                            ) : '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Çalıştığı Kurum</span>
                            <span className="font-semibold text-gray-800 text-xs">{katilimciObj.calistigi_kurum || '—'}</span>
                          </div>
                          <div className="bg-white border border-gray-200/70 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Pozisyon</span>
                            <span className="font-semibold text-gray-800 text-xs">{katilimciObj.pozisyon || '—'}</span>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200/70 rounded-xl p-3.5 text-xs text-gray-700">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">İş & Sorumluluk Açıklaması</span>
                          {katilimciObj.is_aciklamasi && String(katilimciObj.is_aciklamasi).trim() ? (
                            <p className="whitespace-pre-line text-xs">{katilimciObj.is_aciklamasi}</p>
                          ) : (
                            <p className="text-gray-400 italic">İş açıklaması girilmedi.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB: GİRİŞ & AKTİVİTE GEÇMİŞİ ─── */}
              {!detailLoading && activeTab === 'aktivite' && (
                <div className="space-y-6">
                  {/* Özet Kartları */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Giriş Durumu</span>
                      {Number(katilimciObj.giris_sayisi) > 0 || katilimciObj.son_giris_tarihi ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Giriş Yaptı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Henüz Giriş Yok
                        </span>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Toplam Giriş Sayısı</span>
                      <span className="text-xl font-black text-gray-800 tabular-nums">
                        {Number(katilimciObj.giris_sayisi) || 0} <span className="text-xs font-semibold text-gray-400">kez</span>
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">İlk Giriş Tarihi</span>
                      <span className="text-xs font-bold text-gray-700 font-mono block">
                        {katilimciObj.ilk_giris_tarihi ? new Date(katilimciObj.ilk_giris_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Son Aktivite Zamanı</span>
                      <span className="text-xs font-bold text-gray-700 font-mono block">
                        {katilimciObj.son_aktivite_tarihi ? new Date(katilimciObj.son_aktivite_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Log Listesi */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">Son 10 Oturum & Aktivite Logu</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Katılımcının sistem erişim hareketleri kronolojik olarak sıralanır</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] text-slate-600 font-medium">
                        🛡️ KVKK & Gizlilik Uyumlu (IP Kaydedilmez)
                      </div>
                    </div>

                    {aktiviteLoglari.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl py-12 text-center text-gray-400 text-xs italic">
                        Bu katılımcı için henüz aktivite logu kaydedilmemiş. Katılımcı sisteme giriş yaptığında veya panel açtığında kayıtlar burada listelenecektir.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold bg-gray-50/50">
                              <th className="px-3 py-2.5 rounded-l-xl">Olay Tipi</th>
                              <th className="px-3 py-2.5">Tarih & Saat</th>
                              <th className="px-3 py-2.5">Sayfa / Rota</th>
                              <th className="px-3 py-2.5 rounded-r-xl">Tarayıcı / Cihaz</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {aktiviteLoglari.map((log) => {
                              const EVENT_MAP = {
                                login: { label: 'Sisteme Giriş', icon: '🔑', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                                password_recovery_login: { label: 'Şifre Belirleme Girişi', icon: '🔓', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
                                auth_backfill_login: { label: 'Geçmiş Auth Girişi', icon: '⏳', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', note: 'Supabase Auth geçmişi' },
                                panel_open: { label: 'Panel Açılışı', icon: '💻', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
                                activity_ping: { label: 'Aktivite Sinyali', icon: '💓', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
                              }
                              const ev = EVENT_MAP[log.event_type] || { label: log.event_type || 'Aktivite', icon: '📌', cls: 'bg-slate-100 text-slate-700 border-slate-200' }
                              const tarihFormatted = log.olusturulma_tarihi
                                ? new Date(log.olusturulma_tarihi).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : '—'

                              return (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${ev.cls}`}>
                                        <span>{ev.icon}</span>
                                        <span>{ev.label}</span>
                                      </span>
                                      {ev.note && (
                                        <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                          {ev.note}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-gray-600 whitespace-nowrap">
                                    {tarihFormatted}
                                  </td>
                                  <td className="px-3 py-3 text-gray-500 font-mono text-[11px]">
                                    {log.path || '/katilimci'}
                                  </td>
                                  <td className="px-3 py-3 text-gray-600">
                                    {log.user_agent || 'Web Browser'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 2: PUAN DÜZENLEME & NOTLAR ─── */}
              {!detailLoading && activeTab === 'puanlar' && (
                <div className="space-y-6">
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
                      <div>
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Puan Hesaplama & Manuel Giriş</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Otomatik hesaplanan alt puanları inceleyebilir veya manuel puan ekleyebilirsiniz</p>
                      </div>
                      <div className="bg-white border border-amber-300 px-4 py-2 rounded-2xl shadow-2xs">
                        <span className="text-xs font-bold text-amber-700">
                          Canlı Toplam Puan: <strong className="text-lg font-black text-amber-900">{calcLiveTotal}</strong> puan
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-2xs">
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Görev Puanı</label>
                        <input
                          type="number"
                          readOnly
                          value={scoreForm.gorev_puani}
                          className="w-full px-3.5 py-2.5 text-base rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 font-bold cursor-not-allowed"
                        />
                        <span className="text-[10px] text-gray-400 block mt-1">Teslim değerlendirmelerinden gelir</span>
                      </div>
                      <div className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-2xs">
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Toplantı Puanı</label>
                        <input
                          type="number"
                          readOnly
                          value={scoreForm.toplanti_katilim_puani}
                          className="w-full px-3.5 py-2.5 text-base rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 font-bold cursor-not-allowed"
                        />
                        <span className="text-[10px] text-gray-400 block mt-1">Toplantı kayıtlarından gelir</span>
                      </div>
                      <div className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-2xs">
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Etkileşim Bonusu</label>
                        <input
                          type="number"
                          readOnly
                          value={scoreForm.etkilesim_bonus_puani}
                          className="w-full px-3.5 py-2.5 text-base rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 font-bold cursor-not-allowed"
                        />
                        <span className="text-[10px] text-gray-400 block mt-1">Sosyal medya kayıtlarından gelir</span>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-300 rounded-2xl p-4 shadow-2xs">
                        <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">Manuel Puan ★</label>
                        <input
                          type="number"
                          value={scoreForm.manuel_puan}
                          onChange={e => setScoreForm(f => ({ ...f, manuel_puan: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-base rounded-xl border border-amber-400 bg-white focus:ring-2 focus:ring-amber-400 font-black text-amber-950 shadow-2xs"
                        />
                        <span className="text-[10px] text-amber-700 font-semibold block mt-1">Admin tarafından girilir</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white border border-amber-200/70 rounded-2xl p-4 shadow-2xs space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                          <span>🔒 Admin İç Notu</span>
                          <span className="text-[10px] text-gray-400 font-normal">Yalnızca yöneticiler görür</span>
                        </label>
                        <textarea
                          rows={3}
                          value={scoreForm.admin_ici_not}
                          onChange={e => setScoreForm(f => ({ ...f, admin_ici_not: e.target.value }))}
                          placeholder="Yalnızca admin yöneticilerin görebileceği dahili notlar…"
                          className="w-full p-3 text-xs rounded-xl border border-amber-200/80 bg-amber-50/30 focus:ring-2 focus:ring-amber-300 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="bg-white border border-emerald-200/70 rounded-2xl p-4 shadow-2xs space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                          <span>👁️ Katılımcıya Görünen Not</span>
                          <span className="text-[10px] text-emerald-600 font-normal">Katılımcı panelinde görünür</span>
                        </label>
                        <textarea
                          rows={3}
                          value={scoreForm.katilimciya_gorunen_not}
                          onChange={e => setScoreForm(f => ({ ...f, katilimciya_gorunen_not: e.target.value }))}
                          placeholder="Katılımcının panelinde görebileceği genel geri bildirim notu…"
                          className="w-full p-3 text-xs rounded-xl border border-emerald-200/80 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-300 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        id="btn-save-perf-score"
                        onClick={handleScoreSave}
                        disabled={savingScore}
                        className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {savingScore ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Ic.Check c="w-4 h-4" />}
                        Manuel Puan & Notları Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: TOPLANTI KATILIMI ─── */}
              {!detailLoading && activeTab === 'toplanti' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Sol: Ekleme Formu */}
                  <form onSubmit={handleToplantiSubmit} className="lg:col-span-5 bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅</span> Yeni Toplantı Katılımı Ekle
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Toplantı Başlığı ★</label>
                        <input
                          type="text"
                          required
                          value={toplantiForm.baslik}
                          onChange={e => setToplantiForm(f => ({ ...f, baslik: e.target.value }))}
                          placeholder="Örn: Hafta 2 Değerlendirme"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Tarih</label>
                          <input
                            type="date"
                            value={toplantiForm.tarih}
                            onChange={e => setToplantiForm(f => ({ ...f, tarih: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Katılım Puanı</label>
                          <input
                            type="number"
                            value={toplantiForm.katilim_puani}
                            onChange={e => setToplantiForm(f => ({ ...f, katilim_puani: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 pt-1">
                        <input
                          type="checkbox"
                          id="toplanti-katildi"
                          checked={toplantiForm.katildi_mi}
                          onChange={e => setToplantiForm(f => ({ ...f, katildi_mi: e.target.checked }))}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-300 cursor-pointer"
                        />
                        <label htmlFor="toplanti-katildi" className="text-xs font-bold text-gray-700 cursor-pointer">Toplantıya Katıldı mı?</label>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Toplantı Notu</label>
                        <input
                          type="text"
                          value={toplantiForm.not_metni}
                          onChange={e => setToplantiForm(f => ({ ...f, not_metni: e.target.value }))}
                          placeholder="Katılım veya mazeret açıklaması…"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingToplanti}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
                      >
                        {savingToplanti ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Ic.Plus c="w-3.5 h-3.5" />}
                        Toplantı Kaydını Ekle
                      </button>
                    </div>
                  </form>

                  {/* Sağ: Liste */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Toplantı Katılım Geçmişi ({toplantiKatilimlari.length})</h5>
                      <span className="text-xs text-emerald-700 font-semibold">
                        Toplam Katılım: {toplantiKatilimlari.filter(t => t.katildi_mi).length} / {toplantiKatilimlari.length}
                      </span>
                    </div>
                    {toplantiKatilimlari.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-gray-400 italic text-xs">
                        Henüz kayıtlı toplantı bulunmuyor.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {toplantiKatilimlari.map(tk => {
                          if (!tk || typeof tk !== 'object') return null
                          return (
                            <div key={tk.id || Math.random()} className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs hover:shadow-xs transition-shadow">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800 text-sm">{String(tk.baslik || 'Toplantı')}</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tk.katildi_mi ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {tk.katildi_mi ? '✅ Katıldı' : '❌ Katılmadı'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400">{String(tk.tarih || '—')} {tk.not_metni ? `· Not: ${String(tk.not_metni)}` : ''}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                                  +{Number(tk.katilim_puani) || 0} puan
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToplantiDelete(tk.id)}
                                  disabled={deletingToplanti === tk.id}
                                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all flex items-center gap-1 disabled:opacity-50"
                                >
                                  {deletingToplanti === tk.id ? <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Ic.Trash c="w-3.5 h-3.5" />}
                                  Sil
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 4: SOSYAL MEDYA ─── */}
              {!detailLoading && activeTab === 'sosyal' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Sol: Form */}
                  <form onSubmit={handleSosyalSubmit} className="lg:col-span-5 bg-purple-50/50 border border-purple-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📱</span> Sosyal Medya Performansı Ekle
                      </h4>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Tahmini: %{Number(sosyalForm.takipci_sayisi) > 0 ? ((Number(sosyalForm.etkilesim_sayisi) || 0) / Number(sosyalForm.takipci_sayisi) * 100).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Platform ★</label>
                          <select
                            value={sosyalForm.platform}
                            onChange={e => setSosyalForm(f => ({ ...f, platform: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          >
                            <option value="Instagram">Instagram</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Twitter">Twitter / X</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Diger">Diğer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Bonus Puan</label>
                          <input
                            type="number"
                            value={sosyalForm.bonus_puan}
                            onChange={e => setSosyalForm(f => ({ ...f, bonus_puan: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Takipçi Sayısı</label>
                          <input
                            type="number"
                            value={sosyalForm.takipci_sayisi}
                            onChange={e => setSosyalForm(f => ({ ...f, takipci_sayisi: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Etkileşim Sayısı</label>
                          <input
                            type="number"
                            value={sosyalForm.etkilesim_sayisi}
                            onChange={e => setSosyalForm(f => ({ ...f, etkilesim_sayisi: e.target.value }))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Not / Link</label>
                        <input
                          type="text"
                          value={sosyalForm.not_metni}
                          onChange={e => setSosyalForm(f => ({ ...f, not_metni: e.target.value }))}
                          placeholder="Paylaşım bağlantısı veya kısa not…"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingSosyal}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
                      >
                        {savingSosyal ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Ic.Plus c="w-3.5 h-3.5" />}
                        Performans Kaydet
                      </button>
                    </div>
                  </form>

                  {/* Sağ: Liste */}
                  <div className="lg:col-span-7 space-y-3">
                    <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sosyal Medya Kayıtları ({sosyalMedyaList.length})</h5>
                    {sosyalMedyaList.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-gray-400 italic text-xs">
                        Henüz sosyal medya performansı girilmemiş.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {sosyalMedyaList.map(sm => {
                          if (!sm || typeof sm !== 'object') return null
                          return (
                            <div key={sm.id || Math.random()} className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs hover:shadow-xs transition-shadow">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-800 text-sm">{String(sm.platform || 'Platform')}</span>
                                  <span className="text-[11px] text-gray-500">
                                    {Number(sm.takipci_sayisi) || 0} takipçi · {Number(sm.etkilesim_sayisi) || 0} etkileşim · <strong className="text-purple-600 font-bold">%{Number(sm.etkilesim_orani) || 0}</strong> oran
                                  </span>
                                </div>
                                {sm.not_metni && <p className="text-[11px] text-gray-400">{String(sm.not_metni)}</p>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                                  +{Number(sm.bonus_puan) || 0} bonus
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSosyalDelete(sm.id)}
                                  disabled={deletingSosyal === sm.id}
                                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all flex items-center gap-1 disabled:opacity-50"
                                >
                                  {deletingSosyal === sm.id ? <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Ic.Trash c="w-3.5 h-3.5" />}
                                  Sil
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 5: TESLİMLER & TIMELINE ─── */}
              {!detailLoading && activeTab === 'teslimler' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Görev Teslimleri & Değerlendirme Detayları ({teslimlerList.length})</h5>
                  </div>
                  {teslimlerList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-gray-400 italic text-xs">
                      Bu katılımcıya ait henüz görev teslimi bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teslimlerList.map(t => {
                        if (!t || typeof t !== 'object') return null
                        const fileUrl = t.teslim_dosyasi_url || t.teslim_dosyasi
                        const extLink = t.teslim_linki
                        const activeLink = fileUrl || extLink || t.dosya_linki

                        return (
                          <div key={t.id || Math.random()} className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 text-xs shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                              <div>
                                <span className="font-extrabold text-gray-800 text-base block">{String(t.gorev_adi || 'Görev')}</span>
                                <span className="text-[11px] text-gray-400 mt-0.5 block">
                                  Son Teslim Tarihi: {t.teslim_tarihi ? new Date(t.teslim_tarihi).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 self-start sm:self-center">
                                <span className="font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
                                  {Number(t.alinan_puan) || 0} puan
                                </span>
                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  {String(t.durum_etiketi || t.durum || 'BEKLIYOR')}
                                </span>
                              </div>
                            </div>

                            {t.aciklama && (
                              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs text-gray-700">
                                <span className="font-bold block text-[10px] text-gray-400 uppercase mb-1">Katılımcı Teslim Açıklaması</span>
                                {String(t.aciklama)}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                              {fileUrl ? (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shadow-2xs"
                                >
                                  <span>📎</span>
                                  <span>Yüklenen Dosyayı Aç</span>
                                </a>
                              ) : null}

                              {extLink ? (
                                <a
                                  href={extLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-all shadow-2xs"
                                >
                                  <span>🔗</span>
                                  <span>Harici Bağlantıyı Aç</span>
                                </a>
                              ) : null}

                              {!fileUrl && !extLink && activeLink ? (
                                <a
                                  href={activeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shadow-2xs"
                                >
                                  <span>📎</span>
                                  <span>Dosyayı / Linki Aç</span>
                                </a>
                              ) : null}

                              {!fileUrl && !extLink && !activeLink && (
                                <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                  Dosya veya bağlantı bulunmuyor.
                                </span>
                              )}
                            </div>

                            {t.mentor_yorumu && (
                              <div className="text-xs text-gray-700 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 italic">
                                <strong className="text-amber-900 not-italic font-bold block mb-1">Mentor Geri Bildirimi:</strong>
                                "{String(t.mentor_yorumu)}"
                              </div>
                            )}

                            {/* TIMELINE */}
                            <div className="pt-3 border-t border-gray-100">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                📜 İşlem Geçmişi & Revizyon Timeline'ı
                              </span>
                              <TeslimTimeline hareketler={t.hareketler || t.teslim_hareketleri || t.timeline} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
