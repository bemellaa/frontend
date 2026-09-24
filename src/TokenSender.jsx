// src/TokenSender.jsx
import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "./auth/AuthConfig";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export function TokenSender() {
    const { instance, accounts } = useMsal();
    const [tokenJWT, setTokenJWT] = useState("");
    const [apiResponse, setApiResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const acquireAccessToken = async () => {
        const request = {
            ...apiRequest,
            account: accounts[0]
        };

        try {
            const response = await instance.acquireTokenSilent(request);
            return response.accessToken;
        } catch (silentError) {
            console.warn("Fallo el token silencioso, redirigiendo a Azure:", silentError);
            sessionStorage.setItem("msal_pending_api_call", "1");
            await instance.acquireTokenRedirect(request);
            return null;
        }
    };

    const handleGetTokenAndCallApi = async (endpoint) => {
        if (accounts.length === 0) return;

        setLoading(true);
        setApiResponse("");

        try {
            const accessToken = await acquireAccessToken();
            if (!accessToken) return;
            setTokenJWT(accessToken);
            console.log("Token JWT obtenido con éxito:", accessToken);

            // Nota: endpoint ya viene limpio (ej. "admin", "usuario", etc.)
            const res = await fetch(`${backendUrl}/${endpoint}`, {
                method: "GET", // Cambia a "POST" si tu backend lo exige en esa ruta específica
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }

            if (!res.ok) {
                setApiResponse(`HTTP ${res.status} ${res.statusText}\n\n${typeof data === "string" ? data : JSON.stringify(data, null, 2)}`);
            } else {
                setApiResponse(typeof data === "string" ? data : JSON.stringify(data, null, 2));
            }

        } catch (error) {
            console.error("Error al adquirir el token o consultar la API:", error);
            setApiResponse("Error crítico de autenticación: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem("msal_pending_api_call") === "1") {
            sessionStorage.removeItem("msal_pending_api_call");
            // Nota: Si recarga por redirección, por defecto puedes llamar al endpoint base o admin
            handleGetTokenAndCallApi("admin");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (accounts.length === 0) return null;

    return (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '6px' }}>
            <h3>Prueba de envío de Token al Backend</h3>
            <p style={{ fontSize: '14px', color: '#555' }}>
                Haz clic para obtener tu Token JWT de Azure y enviarlo en el header <code style={{ background: '#eee', padding: '2px 4px' }}>Authorization: Bearer &lt;token&gt;</code>.
            </p>

            {/* CORREGIDO: Se usa una función flecha () => handleGetTokenAndCallApi(...) en cada botón */}
            <button
                onClick={() => handleGetTokenAndCallApi("admin")}
                disabled={loading}
                style={buttonStyle}
            >
                {loading ? "Obteniendo Token..." : "Consultar al admin"}
            </button>
            
            <button
                onClick={() => handleGetTokenAndCallApi("usuario")}
                disabled={loading}
                style={buttonStyle}
            >
                {loading ? "Obteniendo Token..." : "Consultar user"}
            </button>

            <button
                onClick={() => handleGetTokenAndCallApi("ambos-roles")}
                disabled={loading}
                style={buttonStyle}
            >
                {loading ? "Obteniendo Token..." : "Consultar ambos roles"}
            </button>

            <button
                onClick={() => handleGetTokenAndCallApi("todos-roles")}
                disabled={loading}
                style={buttonStyle}
            >
                {loading ? "Obteniendo Token..." : "Consultar cualquier rol"}
            </button>

            <button
                onClick={() => handleGetTokenAndCallApi("public")}
                disabled={loading}
                style={buttonStyle}
            >
                {loading ? "Obteniendo Token..." : "Consultar public"}
            </button>

            {tokenJWT && (
                <div style={{ marginTop: '15px' }}>
                    <h4>Token JWT Capturado:</h4>
                    <textarea
                        readOnly
                        value={tokenJWT}
                        rows={4}
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', padding: '8px', background: '#fff' }}
                    />
                </div>
            )}

            {apiResponse && (
                <div style={{ marginTop: '15px' }}>
                    <h4>Respuesta del Backend / API Gateway:</h4>
                    <pre style={{ background: '#333', color: '#adff2f', padding: '10px', borderRadius: '4px', overflowX: 'auto', fontSize: '12px' }}>
                        {apiResponse}
                    </pre>
                </div>
            )}
        </div>
    );
}

// Estilo auxiliar para no repetir código en los botones
const buttonStyle = {
    backgroundColor: '#107c10',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '10px',
    marginRight: '8px'
};