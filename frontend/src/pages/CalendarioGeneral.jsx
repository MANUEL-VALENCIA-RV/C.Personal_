import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendarioGeneral.css";
import { useTrabajador } from "../hooks/useTrabajadores.js";

const STORAGE_KEY = "dias_no_laborales";

export default function CalendarioGeneral() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: trabajador } = useTrabajador(id);

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
    <section className="calendario-page">
      <div className="calendario-header">
        <div>
          <h1>{trabajador ? `Calendario de ${trabajador.nombre}` : "Calendario General"}</h1>
          <p>{trabajador ? "Aquí se marca el día de ingreso del trabajador." : "Consulta el calendario general del sistema."}</p>
        </div>

        <div className="calendario-actions">
          <button
            type="button"
            className={`btn-no-laborales ${modoEdicion ? "activo" : ""}`}
            onClick={() => setModoEdicion(!modoEdicion)}
          >
            {modoEdicion ? "Finalizar edición" : "Editar días no laborales"}
          </button>

          <button
            type="button"
            className="btn-regresar"
            onClick={() => (trabajador ? navigate(`/expediente/${id}`) : navigate("/"))}
          >
            ← Regresar
          </button>
        </div>
      </div>

      <div className="calendario-layout">
        <div className="calendario-card">
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

              if (fechaTexto === fechaIngresoTexto) clases.push("dia-ingreso");
              if (diasNoLaborales.includes(fechaTexto)) clases.push("dia-no-laboral");

              return clases.join(" ");
            }}
          />
        </div>

        <div className="calendario-info">
          {trabajador && (
            <>
              <h3>Ingreso del trabajador</h3>
              <p><strong>{trabajador.nombre}</strong></p>
              <p>Fecha de ingreso: <strong>{fechaIngresoTexto || "Sin registrar"}</strong></p>
            </>
          )}

          <h3>Días no laborales</h3>

          {diasNoLaborales.length === 0 ? (
            <p>No has seleccionado días.</p>
          ) : (
            <div className="dias-lista">
              {diasNoLaborales.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  className="dia-chip"
                  disabled={!modoEdicion}
                  onClick={() => setDiasNoLaborales((prev) => prev.filter((d) => d !== dia))}
                >
                  {dia} {modoEdicion && "✕"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
