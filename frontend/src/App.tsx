import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type Availability, type Equipment, type Reservation } from "./api";
import { buenosAiresInputToIso, formatBuenosAires, todayInBuenosAires } from "./dateTime";

type Notice = { kind: "success" | "error" | "info"; text: string };

function App() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [date, setDate] = useState(todayInBuenosAires);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [requester, setRequester] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedEquipment = equipment.find(({ id }) => id === selectedId);
  const equipmentNames = useMemo(() => new Map(equipment.map(({ id, name }) => [id, name])), [equipment]);
  const orderedReservations = useMemo(
    () => [...reservations].sort((a, b) => Date.parse(b.start) - Date.parse(a.start)),
    [reservations],
  );

  const refreshReservations = useCallback(async () => {
    setReservations(await api.reservations());
  }, []);

  useEffect(() => {
    Promise.all([api.equipment(), api.reservations()])
      .then(([items, history]) => {
        setEquipment(items);
        setSelectedId(items[0]?.id ?? "");
        setReservations(history);
      })
      .catch((error: Error) => setNotice({ kind: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  function getInterval() {
    const start = buenosAiresInputToIso(date, startTime);
    const end = buenosAiresInputToIso(date, endTime);
    if (Date.parse(start) >= Date.parse(end)) throw new Error("El horario de inicio debe ser anterior al fin.");
    return { start, end };
  }

  async function checkAvailability() {
    setBusy(true);
    setNotice(null);
    setAvailability(null);
    try {
      const { start, end } = getInterval();
      const result = await api.availability(selectedId, start, end);
      setAvailability(result);
      setNotice(result.available
        ? { kind: "success", text: `${selectedEquipment?.name} está libre en el horario elegido.` }
        : { kind: "error", text: "Hay un conflicto de horarios. Elegí otro intervalo para esta unidad." });
    } catch (error) {
      setNotice({ kind: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function createReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const { start, end } = getInterval();
      const created = await api.createReservation({ equipmentId: selectedId, requester, start, end });
      setReservations((current) => [created, ...current]);
      setRequester("");
      setAvailability(null);
      setNotice({ kind: "success", text: "Reserva creada correctamente." });
    } catch (error) {
      const apiError = error as ApiError;
      setNotice({
        kind: "error",
        text: apiError instanceof ApiError && apiError.status === 409
          ? "Hay un conflicto de horarios: esta unidad ya tiene una reserva activa en ese intervalo."
          : apiError.message,
      });
      if (apiError instanceof ApiError && apiError.status === 409) {
        setAvailability({ equipmentId: selectedId, ...getInterval(), available: false });
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancelReservation(id: string) {
    setBusy(true);
    setNotice(null);
    try {
      const cancelled = await api.cancelReservation(id);
      setReservations((current) => current.map((item) => item.id === id ? cancelled : item));
      setNotice({ kind: "success", text: "Reserva cancelada. El registro permanece en el historial." });
    } catch (error) {
      setNotice({ kind: "error", text: (error as Error).message });
      await refreshReservations();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-700 text-lg text-white shadow-sm">⌁</div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Laboratorio</p>
              <p className="text-xs text-slate-500">Gestión de equipos</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" /> Sistema local activo
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12">
        <section className="mb-9 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Reservas de laboratorio</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Encontrá tu próximo horario</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Consultá disponibilidad y reservá una unidad. Los horarios se muestran en hora de Buenos Aires.
          </p>
        </section>

        {notice && (
          <div role="status" className={`mb-7 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : notice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
            <span className="mt-0.5 font-bold">{notice.kind === "success" ? "✓" : "!"}</span>
            <span>{notice.text}</span>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className="space-y-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Equipos disponibles</h2>
                  <p className="mt-1 text-sm text-slate-500">Seleccioná una unidad física.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{equipment.length} unidades</span>
              </div>
              {loading ? <p className="py-6 text-sm text-slate-500">Cargando inventario…</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {equipment.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setAvailability(null); }}
                      aria-pressed={selectedId === item.id}
                      className={`group flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selectedId === item.id ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-lg ${selectedId === item.id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {index < 2 ? "◉" : index === 2 ? "⌁" : index === 3 ? "⌗" : "ϟ"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.name}</span>
                        <span className="mt-1 block text-xs text-slate-500">{item.id}</span>
                      </span>
                      {selectedId === item.id && <span className="ml-auto text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">Consultar y reservar</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedEquipment ? `${selectedEquipment.id} · ${selectedEquipment.name}` : "Elegí un equipo para empezar."}</p>
              </div>
              <form onSubmit={createReservation} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="field-label sm:col-span-1">Fecha
                    <input required type="date" value={date} onChange={(event) => { setDate(event.target.value); setAvailability(null); }} className="field-input" />
                  </label>
                  <label className="field-label">Desde
                    <input required type="time" value={startTime} onChange={(event) => { setStartTime(event.target.value); setAvailability(null); }} className="field-input" />
                  </label>
                  <label className="field-label">Hasta
                    <input required type="time" value={endTime} onChange={(event) => { setEndTime(event.target.value); setAvailability(null); }} className="field-input" />
                  </label>
                </div>
                {availability && <div className={`rounded-xl px-4 py-3 text-sm ${availability.available ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                  {availability.available ? "Horario disponible" : "Conflicto: el equipo ya está reservado en ese intervalo"}
                </div>}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={checkAvailability} disabled={busy || !selectedId} className="secondary-button flex-1">
                    {busy ? "Procesando…" : "Consultar disponibilidad"}
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <label className="field-label">Nombre del solicitante
                    <input required maxLength={120} value={requester} onChange={(event) => setRequester(event.target.value)} placeholder="Por ejemplo, Alex García" className="field-input" />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">Usá un nombre ficticio. No se solicitan datos de cuenta.</p>
                </div>
                <button type="submit" disabled={busy || !selectedId} className="primary-button w-full">
                  {busy ? "Procesando…" : "Confirmar reserva"}
                </button>
              </form>
            </section>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Historial de reservas</h2>
                <p className="mt-1 text-sm text-slate-500">Activas y canceladas</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{reservations.length}</span>
            </div>
            <div className="space-y-3">
              {loading ? <p className="py-6 text-sm text-slate-500">Cargando reservas…</p> : orderedReservations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
                  <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-slate-100 text-lg text-slate-500">▤</span>
                  <p className="text-sm font-medium text-slate-700">Todavía no hay reservas</p>
                  <p className="mt-1 text-xs text-slate-500">Cuando crees una, aparecerá acá.</p>
                </div>
              ) : orderedReservations.map((reservation) => (
                <article key={reservation.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{equipmentNames.get(reservation.equipmentId) ?? reservation.equipmentId}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{reservation.equipmentId} · {reservation.requester}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${reservation.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {reservation.status === "ACTIVE" ? "Activa" : "Cancelada"}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                    <p>{formatBuenosAires(reservation.start)}</p>
                    <p className="text-slate-400">hasta</p>
                    <p>{formatBuenosAires(reservation.end)}</p>
                  </div>
                  {reservation.status === "ACTIVE" && <button type="button" disabled={busy} onClick={() => cancelReservation(reservation.id)} className="mt-3 text-xs font-semibold text-rose-700 transition hover:text-rose-900 disabled:opacity-50">
                    Cancelar reserva
                  </button>}
                </article>
              ))}
            </div>
            {!loading && reservations.length > 0 && <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">Las reservas canceladas se conservan en este historial.</p>}
          </section>
        </div>
        <footer className="mt-9 flex flex-col gap-1 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>Reservas de laboratorio · aplicación local</span>
          <span>Zona horaria: America/Argentina/Buenos_Aires</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
