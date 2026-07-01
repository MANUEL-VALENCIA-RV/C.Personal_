import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarioModal.css";

const STORAGE_KEY = "dias_no_laborales";

export default function CalendarioModal({ trabajador, onClose }) {
  const [diasNoLaborales, setDiasNoLaborales] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setDiasNoLaborales(guardados);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diasNoLaborales));
  }, [diasNoLaborales]);

  const convertirFecha = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fechaIngresoValor =
    trabajador?.fechaIngreso ||
    trabajador?.fecha_ingreso ||
    trabajador?.datos_completos?.["Fecha de ingreso"] ||
    trabajador?.datos_completos?.["Fecha Ingreso"] ||
    trabajador?.datos_completos?.["fechaIngreso"] ||
    trabajador?.datos_completos?.["fecha_ingreso"];

  const fechaIngreso = fechaIngresoValor ? new Date(fechaIngresoValor) : new Date();

  const fechaIngresoTexto = fechaIngresoValor ? convertirFecha(fechaIngreso) : null;

  const cambiarDiaNoLaboral = (fecha) => {
    const fechaTexto = convertirFecha(fecha);

    setDiasNoLaborales((prev) =>
      prev.includes(fechaTexto)
        ? prev.filter((dia) => dia !== fechaTexto)
        : [...prev, fechaTexto]
    );
  };

  return (
    <div className="cal-modal-overlay">
      <div className="cal-modal">
        <div className="cal-modal-header">
          <div>
            <h2>Calendario de {trabajador?.nombre || "trabajador"}</h2>
            <p>
              Fecha de ingreso:{" "}
              <strong>{fechaIngresoTexto || "Sin registrar"}</strong>
            </p>
          </div>

          <button type="button" className="cal-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cal-modal-actions">
          <button
            type="button"
            className={`cal-btn-edit ${modoEdicion ? "activo" : ""}`}
            onClick={() => setModoEdicion(!modoEdicion)}
          >
            {modoEdicion ? "Finalizar edición" : "Editar días no laborales"}
          </button>
        </div>

        {modoEdicion && (
          <p className="cal-aviso">
            Modo edición activo: haz clic en un día para marcarlo o quitarlo.
          </p>
        )}

        <div className="cal-modal-grid">
          <div className="cal-modal-calendar">
            <Calendar
              value={fechaIngreso}
              activeStartDate={fechaIngreso}
              onClickDay={(fecha) => {
                if (!modoEdicion) return;
                cambiarDiaNoLaboral(fecha);
              }}
              tileClassName={({ date }) => {
                const fechaTexto = convertirFecha(date);
                const clases = [];

                if (fechaTexto === fechaIngresoTexto) {
                  clases.push("dia-ingreso");
                }

                if (diasNoLaborales.includes(fechaTexto)) {
                  clases.push("dia-no-laboral");
                }

                return clases.join(" ");
              }}
            />
          </div>

          <div className="cal-modal-info">
            <h3>Días no laborales</h3>

            {diasNoLaborales.length === 0 ? (
              <p>No hay días seleccionados.</p>
            ) : (
              <div className="cal-dias-lista">
                {diasNoLaborales.map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    className="cal-dia-chip"
                    disabled={!modoEdicion}
                    onClick={() =>
                      setDiasNoLaborales((prev) => prev.filter((d) => d !== dia))
                    }
                  >
                    {dia} {modoEdicion && "✕"}
                  </button>
                ))}
              </div>
            )}

            <div className="cal-leyenda">
              <span><b className="leyenda-ingreso" /> Día de ingreso</span>
              <span><b className="leyenda-no-laboral" /> Día no laboral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
