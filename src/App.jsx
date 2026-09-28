// src/App.jsx
import React from 'react';
import { LoginButton } from './component/LoginButton';
import { TokenSender } from './TokenSender';
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuth } from "react-oidc-context";

function App() {
  const isAuthenticatedAzure = useIsAuthenticated();
  const cognito = useAuth();

  // Hay dos proveedores de identidad conviviendo: la sesion es valida si
  // cualquiera de los dos entrego un token.
  const isAuthenticated = isAuthenticatedAzure || cognito.isAuthenticated;
  const proveedor = isAuthenticatedAzure ? 'Azure Entra ID' : 'AWS Cognito';

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Dashboard Frontend - Arquitectura Cloud OIDC</h2>
      <hr style={{ margin: '20px 0' }} />

      <div style={{ marginBottom: '20px' }}>
        <LoginButton />
      </div>

      {isAuthenticated ? (
        <TokenSender />
      ) : (
        <p style={{ color: '#605e5c', fontStyle: 'italic' }}>
          Inicia sesión con tu cuenta de Microsoft o de AWS Cognito para habilitar el consumo del token hacia el API Gateway.
        </p>
      )}

      {isAuthenticated && (
        <p style={{ color: '#605e5c', fontSize: '13px' }}>
          Sesión activa con: <strong>{proveedor}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
