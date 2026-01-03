"use client";

import { GridScan } from "@/components/GridScan";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const initialStatus = { type: "", message: "" };
const COUNTRY_PREFIXES = [
  { name: "Afghanistan", code: "93" },
  { name: "Albania", code: "355" },
  { name: "Algeria", code: "213" },
  { name: "American Samoa", code: "1684" },
  { name: "Andorra", code: "376" },
  { name: "Angola", code: "244" },
  { name: "Anguilla", code: "1264" },
  { name: "Antarctica", code: "672" },
  { name: "Antigua and Barbuda", code: "1268" },
  { name: "Argentina", code: "54" },
  { name: "Armenia", code: "374" },
  { name: "Aruba", code: "297" },
  { name: "Australia", code: "61" },
  { name: "Austria", code: "43" },
  { name: "Azerbaijan", code: "994" },
  { name: "Bahamas", code: "1242" },
  { name: "Bahrain", code: "973" },
  { name: "Bangladesh", code: "880" },
  { name: "Barbados", code: "1246" },
  { name: "Belarus", code: "375" },
  { name: "Belgium", code: "32" },
  { name: "Belize", code: "501" },
  { name: "Benin", code: "229" },
  { name: "Bermuda", code: "1441" },
  { name: "Bhutan", code: "975" },
  { name: "Bolivia", code: "591" },
  { name: "Bosnia and Herzegovina", code: "387" },
  { name: "Botswana", code: "267" },
  { name: "Brazil", code: "55" },
  { name: "British Indian Ocean Territory", code: "246" },
  { name: "British Virgin Islands", code: "1284" },
  { name: "Brunei", code: "673" },
  { name: "Bulgaria", code: "359" },
  { name: "Burkina Faso", code: "226" },
  { name: "Burundi", code: "257" },
  { name: "Cambodia", code: "855" },
  { name: "Cameroon", code: "237" },
  { name: "Canada", code: "1" },
  { name: "Cape Verde", code: "238" },
  { name: "Cayman Islands", code: "1345" },
  { name: "Central African Republic", code: "236" },
  { name: "Chad", code: "235" },
  { name: "Chile", code: "56" },
  { name: "China", code: "86" },
  { name: "Christmas Island", code: "61" },
  { name: "Cocos (Keeling) Islands", code: "61" },
  { name: "Colombia", code: "57" },
  { name: "Comoros", code: "269" },
  { name: "Congo", code: "242" },
  { name: "Congo (DRC)", code: "243" },
  { name: "Cook Islands", code: "682" },
  { name: "Costa Rica", code: "506" },
  { name: "Cote d'Ivoire", code: "225" },
  { name: "Croatia", code: "385" },
  { name: "Cuba", code: "53" },
  { name: "Curacao", code: "599" },
  { name: "Cyprus", code: "357" },
  { name: "Czech Republic", code: "420" },
  { name: "Denmark", code: "45" },
  { name: "Djibouti", code: "253" },
  { name: "Dominica", code: "1767" },
  { name: "Dominican Republic", code: "1809" },
  { name: "Ecuador", code: "593" },
  { name: "Egypt", code: "20" },
  { name: "El Salvador", code: "503" },
  { name: "Equatorial Guinea", code: "240" },
  { name: "Eritrea", code: "291" },
  { name: "Estonia", code: "372" },
  { name: "Eswatini", code: "268" },
  { name: "Ethiopia", code: "251" },
  { name: "Falkland Islands", code: "500" },
  { name: "Faroe Islands", code: "298" },
  { name: "Fiji", code: "679" },
  { name: "Finland", code: "358" },
  { name: "France", code: "33" },
  { name: "French Guiana", code: "594" },
  { name: "French Polynesia", code: "689" },
  { name: "Gabon", code: "241" },
  { name: "Gambia", code: "220" },
  { name: "Georgia", code: "995" },
  { name: "Germany", code: "49" },
  { name: "Ghana", code: "233" },
  { name: "Gibraltar", code: "350" },
  { name: "Greece", code: "30" },
  { name: "Greenland", code: "299" },
  { name: "Grenada", code: "1473" },
  { name: "Guadeloupe", code: "590" },
  { name: "Guam", code: "1671" },
  { name: "Guatemala", code: "502" },
  { name: "Guernsey", code: "44" },
  { name: "Guinea", code: "224" },
  { name: "Guinea-Bissau", code: "245" },
  { name: "Guyana", code: "592" },
  { name: "Haiti", code: "509" },
  { name: "Honduras", code: "504" },
  { name: "Hong Kong", code: "852" },
  { name: "Hungary", code: "36" },
  { name: "Iceland", code: "354" },
  { name: "India", code: "91" },
  { name: "Indonesia", code: "62" },
  { name: "Iran", code: "98" },
  { name: "Iraq", code: "964" },
  { name: "Ireland", code: "353" },
  { name: "Isle of Man", code: "44" },
  { name: "Israel", code: "972" },
  { name: "Italy", code: "39" },
  { name: "Jamaica", code: "1876" },
  { name: "Japan", code: "81" },
  { name: "Jersey", code: "44" },
  { name: "Jordan", code: "962" },
  { name: "Kazakhstan", code: "7" },
  { name: "Kenya", code: "254" },
  { name: "Kiribati", code: "686" },
  { name: "Kosovo", code: "383" },
  { name: "Kuwait", code: "965" },
  { name: "Kyrgyzstan", code: "996" },
  { name: "Laos", code: "856" },
  { name: "Latvia", code: "371" },
  { name: "Lebanon", code: "961" },
  { name: "Lesotho", code: "266" },
  { name: "Liberia", code: "231" },
  { name: "Libya", code: "218" },
  { name: "Liechtenstein", code: "423" },
  { name: "Lithuania", code: "370" },
  { name: "Luxembourg", code: "352" },
  { name: "Macau", code: "853" },
  { name: "Madagascar", code: "261" },
  { name: "Malawi", code: "265" },
  { name: "Malaysia", code: "60" },
  { name: "Maldives", code: "960" },
  { name: "Mali", code: "223" },
  { name: "Malta", code: "356" },
  { name: "Marshall Islands", code: "692" },
  { name: "Martinique", code: "596" },
  { name: "Mauritania", code: "222" },
  { name: "Mauritius", code: "230" },
  { name: "Mayotte", code: "262" },
  { name: "Mexico", code: "52" },
  { name: "Micronesia", code: "691" },
  { name: "Moldova", code: "373" },
  { name: "Monaco", code: "377" },
  { name: "Mongolia", code: "976" },
  { name: "Montenegro", code: "382" },
  { name: "Montserrat", code: "1664" },
  { name: "Morocco", code: "212" },
  { name: "Mozambique", code: "258" },
  { name: "Myanmar", code: "95" },
  { name: "Namibia", code: "264" },
  { name: "Nauru", code: "674" },
  { name: "Nepal", code: "977" },
  { name: "Netherlands", code: "31" },
  { name: "New Caledonia", code: "687" },
  { name: "New Zealand", code: "64" },
  { name: "Nicaragua", code: "505" },
  { name: "Niger", code: "227" },
  { name: "Nigeria", code: "234" },
  { name: "Niue", code: "683" },
  { name: "Norfolk Island", code: "672" },
  { name: "North Korea", code: "850" },
  { name: "North Macedonia", code: "389" },
  { name: "Northern Mariana Islands", code: "1670" },
  { name: "Norway", code: "47" },
  { name: "Oman", code: "968" },
  { name: "Pakistan", code: "92" },
  { name: "Palau", code: "680" },
  { name: "Palestine", code: "970" },
  { name: "Panama", code: "507" },
  { name: "Papua New Guinea", code: "675" },
  { name: "Paraguay", code: "595" },
  { name: "Peru", code: "51" },
  { name: "Philippines", code: "63" },
  { name: "Poland", code: "48" },
  { name: "Portugal", code: "351" },
  { name: "Puerto Rico", code: "1787" },
  { name: "Qatar", code: "974" },
  { name: "Reunion", code: "262" },
  { name: "Romania", code: "40" },
  { name: "Russia", code: "7" },
  { name: "Rwanda", code: "250" },
  { name: "Saint Barthelemy", code: "590" },
  { name: "Saint Helena", code: "290" },
  { name: "Saint Kitts and Nevis", code: "1869" },
  { name: "Saint Lucia", code: "1758" },
  { name: "Saint Martin", code: "590" },
  { name: "Saint Pierre and Miquelon", code: "508" },
  { name: "Saint Vincent and the Grenadines", code: "1784" },
  { name: "Samoa", code: "685" },
  { name: "San Marino", code: "378" },
  { name: "Sao Tome and Principe", code: "239" },
  { name: "Saudi Arabia", code: "966" },
  { name: "Senegal", code: "221" },
  { name: "Serbia", code: "381" },
  { name: "Seychelles", code: "248" },
  { name: "Sierra Leone", code: "232" },
  { name: "Singapore", code: "65" },
  { name: "Sint Maarten", code: "1721" },
  { name: "Slovakia", code: "421" },
  { name: "Slovenia", code: "386" },
  { name: "Solomon Islands", code: "677" },
  { name: "Somalia", code: "252" },
  { name: "South Africa", code: "27" },
  { name: "South Korea", code: "82" },
  { name: "South Sudan", code: "211" },
  { name: "Spain", code: "34" },
  { name: "Sri Lanka", code: "94" },
  { name: "Sudan", code: "249" },
  { name: "Suriname", code: "597" },
  { name: "Sweden", code: "46" },
  { name: "Switzerland", code: "41" },
  { name: "Syria", code: "963" },
  { name: "Taiwan", code: "886" },
  { name: "Tajikistan", code: "992" },
  { name: "Tanzania", code: "255" },
  { name: "Thailand", code: "66" },
  { name: "Timor-Leste", code: "670" },
  { name: "Togo", code: "228" },
  { name: "Tokelau", code: "690" },
  { name: "Tonga", code: "676" },
  { name: "Trinidad and Tobago", code: "1868" },
  { name: "Tunisia", code: "216" },
  { name: "Turkey", code: "90" },
  { name: "Turkmenistan", code: "993" },
  { name: "Turks and Caicos Islands", code: "1649" },
  { name: "Tuvalu", code: "688" },
  { name: "Uganda", code: "256" },
  { name: "Ukraine", code: "380" },
  { name: "United Arab Emirates", code: "971" },
  { name: "United Kingdom", code: "44" },
  { name: "United States", code: "1" },
  { name: "Uruguay", code: "598" },
  { name: "Uzbekistan", code: "998" },
  { name: "Vanuatu", code: "678" },
  { name: "Vatican City", code: "379" },
  { name: "Venezuela", code: "58" },
  { name: "Vietnam", code: "84" },
  { name: "Virgin Islands (US)", code: "1340" },
  { name: "Wallis and Futuna", code: "681" },
  { name: "Western Sahara", code: "212" },
  { name: "Yemen", code: "967" },
  { name: "Zambia", code: "260" },
  { name: "Zimbabwe", code: "263" },
];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [nombre, setNombre] = useState("");
  const [prefijo, setPrefijo] = useState("34");
  const [telefonoLocal, setTelefonoLocal] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankingStatus, setRankingStatus] = useState(initialStatus);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === "login";

  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setStatus(initialStatus);
    setShowRanking(false);
    setRanking([]);
    setRankingStatus(initialStatus);
    if (nextMode === "register") {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("agch_user");
      }
    }
  };

  const handleShowRanking = async () => {
    setShowRanking(true);
    if (isRankingLoading || ranking.length) return;

    setIsRankingLoading(true);
    setRankingStatus(initialStatus);

    try {
      const response = await fetch("/api/clasificacion");
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRankingStatus({
          type: "error",
          message: "No se pudo cargar la clasificación.",
        });
        setRanking([]);
        return;
      }

      const items = Array.isArray(responseData?.items)
        ? responseData.items
        : [];
      setRanking(items);

      if (!items.length) {
        setRankingStatus({
          type: "info",
          message: "Aún no hay puntuaciones.",
        });
      }
    } catch (error) {
      setRankingStatus({
        type: "error",
        message: "No se pudo cargar la clasificación.",
      });
      setRanking([]);
    } finally {
      setIsRankingLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("agch_user");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id) {
        setCurrentUser(parsed);
        setMode("login");
        if (parsed?.prefijo) setPrefijo(parsed.prefijo);
        if (parsed?.telefono_local) setTelefonoLocal(parsed.telefono_local);
      }
    } catch {
      window.localStorage.removeItem("agch_user");
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;

    const checkVerification = async () => {
      try {
        const response = await fetch(
          `/api/telefono/estado?userId=${encodeURIComponent(currentUser.id)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;
        if (!response.ok || !data?.verified) {
          router.replace(
            `/verificacion?next=${encodeURIComponent("/")}`
          );
        }
      } catch (error) {
        if (isMounted) {
          router.replace(
            `/verificacion?next=${encodeURIComponent("/")}`
          );
        }
      }
    };

    checkVerification();
    return () => {
      isMounted = false;
    };
  }, [currentUser, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(initialStatus);

    const trimmedNombre = nombre.trim();
    const prefixDigits = normalizeDigits(prefijo);
    const phoneDigits = normalizeDigits(telefonoLocal);
    const fullTelefono = `${prefixDigits}${phoneDigits}`;
    const rawPassword = password;

    if (
      !prefixDigits ||
      !phoneDigits ||
      !rawPassword.trim() ||
      (!isLogin && !trimmedNombre)
    ) {
      setStatus({
        type: "error",
        message: "Completa todos los campos antes de continuar.",
      });
      return;
    }

    if (!isLogin && rawPassword.length < 8) {
      setStatus({
        type: "error",
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/usuarios";
      const requestPayload = isLogin
        ? {
            telefono: fullTelefono,
            password: rawPassword,
          }
        : {
            nombre: trimmedNombre,
            telefono: fullTelefono,
            password: rawPassword,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          responseData?.code === "DUPLICATE_PHONE"
            ? "Ese teléfono ya está registrado."
            : responseData?.code === "WEAK_PASSWORD"
            ? "La contraseña debe tener al menos 8 caracteres."
            : responseData?.code === "MISSING_FIELDS"
            ? "Completa todos los campos antes de continuar."
            : responseData?.code === "INVALID_CREDENTIALS"
            ? "Teléfono o contraseña incorrectos."
            : "No se pudo completar la solicitud. Intenta de nuevo.";

        setStatus({ type: "error", message });
        if (isLogin) {
          setCurrentUser(null);
        }
      } else {
        setStatus({
          type: "success",
          message: isLogin
            ? "Sesión iniciada correctamente."
            : "Jugador registrado con éxito.",
        });
        if (isLogin) {
          const userData = responseData?.usuario ?? null;
          const enrichedUser = userData
            ? {
                ...userData,
                telefono: userData.telefono ?? fullTelefono,
                prefijo: prefixDigits,
                telefono_local: phoneDigits,
              }
            : null;
          setCurrentUser(enrichedUser);
          setShowRanking(false);
          setRanking([]);
          setRankingStatus(initialStatus);
          if (enrichedUser && typeof window !== "undefined") {
            window.localStorage.setItem(
              "agch_user",
              JSON.stringify(enrichedUser)
            );
          }
        } else {
          setMode("login");
        }
        setNombre("");
        setTelefonoLocal("");
        setPassword("");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Error de red. Intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GridScan
          sensitivity={0.005}
          lineThickness={1}
          linesColor="#392e4e"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          className="h-full w-full"
        />
      </div>

      <main className="relative z-10 flex w-full max-w-[520px] flex-col items-center text-center">
        {isLogin && currentUser ? (
          <>
            <h1 className="font-[var(--font-press-start)] text-[40px] uppercase tracking-[0.2em] text-[#f5f0ff] drop-shadow-[0_0_26px_rgba(255,159,252,0.55)] sm:text-[52px]">
              ALEX GAMES
            </h1>
            {showRanking ? (
              <div className="mt-8 w-full max-w-[420px] text-center">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
                  <span>Clasificación</span>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/ajustes"
                      className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:border-[#6fd6ff] hover:text-white"
                    >
                      Ajustes
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowRanking(false)}
                      className="transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]"
                    >
                      Volver
                    </button>
                  </div>
                </div>

                {isRankingLoading ? (
                  <p className="mt-4 text-sm text-white/70">
                    Cargando clasificación...
                  </p>
                ) : ranking.length ? (
                  <ol className="mt-4 space-y-2 text-left">
                    {ranking.map((item, index) => (
                      <li
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border bg-[rgba(6,8,16,0.6)] px-4 py-3 text-sm ${
                          index === 0
                            ? "border-[#d4af37]"
                            : index === 1
                            ? "border-[#c0c0c0]"
                            : index === 2
                            ? "border-[#cd7f32]"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/50">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-white/90">
                            {item.nombre || "Jugador"}
                          </span>
                        </div>
                        <span className="text-[#ff9ffc]">
                          {item.puntuacion}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-sm text-white/70">
                    {rankingStatus.message || "Aún no hay puntuaciones."}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-8 w-full max-w-[360px] space-y-3">
                <button
                  type="button"
                  onClick={handleShowRanking}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:bg-[rgba(14,22,38,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(111,214,255,0.4)]"
                >
                  Ver clasificación
                </button>
                <Link
                  href="/minijuego/snake"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:bg-[rgba(24,14,30,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(255,159,252,0.4)]"
                >
                  Jugar minijuego
                </Link>
                <Link
                  href="/ajustes"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:bg-[rgba(14,22,38,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(111,214,255,0.35)]"
                >
                  Ajustes de cuenta
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
              {isLogin ? "Bienvenido de vuelta" : "Registro de jugadores"}
            </p>
            <h1 className="mt-3 font-[var(--font-press-start)] text-[40px] uppercase tracking-[0.2em] text-[#f5f0ff] drop-shadow-[0_0_26px_rgba(255,159,252,0.55)] sm:text-[52px]">
              ALEX GAMES
            </h1>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-white/70">
              {isLogin
                ? "Ingresa con tu teléfono y contraseña."
                : "Completa los datos básicos para crear un jugador."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/60">
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,159,252,0.5)] ${
                  isLogin ? "text-white/50" : "text-white"
                }`}
                aria-pressed={!isLogin}
              >
                Registro
              </button>
              <span className="h-px w-10 bg-white/30" />
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,159,252,0.5)] ${
                  isLogin ? "text-white" : "text-white/50"
                }`}
                aria-pressed={isLogin}
              >
                Login
              </button>
            </div>

            <form
              className="mt-8 w-full max-w-[360px] space-y-4 text-left"
              onSubmit={handleSubmit}
            >
              {!isLogin ? (
                <div className="space-y-2">
                  <label
                    className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                    htmlFor="nombre"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                  htmlFor="telefono"
                >
                  Teléfono
                </label>
                <div className="grid grid-cols-[88px_1fr] gap-3 sm:grid-cols-[120px_1fr]">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                      Prefijo
                    </span>
                    <div className="mt-2 flex items-center rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-2">
                      <span className="text-sm text-white/60">+</span>
                      <select
                        id="prefijo"
                        name="prefijo"
                        className="w-full bg-transparent py-3 pl-2 text-[13px] text-[#f5f0ff] outline-none"
                        value={prefijo}
                        onChange={(event) => setPrefijo(event.target.value)}
                        required
                      >
                        {COUNTRY_PREFIXES.map((country) => (
                          <option
                            key={`${country.name}-${country.code}`}
                            value={country.code}
                          >
                            {country.name} (+{country.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                      Numero
                    </span>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                      value={telefonoLocal}
                      onChange={(event) => setTelefonoLocal(event.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                />
              </div>

              <button
                className="w-full rounded-full bg-gradient-to-br from-[#ff9ffc] to-[#6fd6ff] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#05020c] shadow-[0_14px_30px_rgba(111,214,255,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:from-[#ffd0ff] hover:to-[#9fe3ff] hover:shadow-[0_20px_40px_rgba(255,159,252,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? isLogin
                    ? "Ingresando..."
                    : "Registrando..."
                  : isLogin
                  ? "Iniciar sesión"
                  : "Registrar"}
              </button>
            </form>

            {status.message ? (
              <p
                role="status"
                aria-live="polite"
                className={`mt-5 w-full max-w-[360px] rounded-xl border border-white/15 bg-[rgba(8,10,18,0.7)] px-3 py-2 text-center text-sm text-[#f5f0ff] ${
                  status.type === "success"
                    ? "border-[#7ef3b2]/45 text-[#7ef3b2]"
                    : status.type === "error"
                    ? "border-[#ff8f90]/45 text-[#ff8f90]"
                    : ""
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
