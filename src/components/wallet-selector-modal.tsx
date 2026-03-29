"use client";

import { useState } from "react";
import { useConnect } from "wagmi";
import { X, Wallet, ExternalLink } from "lucide-react";
import Image from "next/image";

export function WalletSelectorModal({ onClose }: { onClose: () => void }) {
  const { connectors, connect } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(connectorId: string) {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;

    setConnecting(connectorId);
    setError(null);

    try {
      connect({ connector }, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setError(err.message || "Connection failed");
          setConnecting(null);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnecting(null);
    }
  }

  // Get connector description
  function getConnectorDescription(connectorId: string) {
    switch (connectorId) {
      case 'injected':
        return 'Connect with MetaMask or browser wallet';
      case 'walletConnect':
        return 'Scan QR code with mobile wallet';
      case 'coinbaseWallet':
      case 'coinbaseWalletSDK':
        return 'Connect with Coinbase Wallet';
      default:
        return 'Connect with your wallet';
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(10, 10, 27, 0.95)",
      backdropFilter: "blur(8px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      animation: "fadeIn 0.3s ease",
    }}>
      <div className="game-panel" style={{
        maxWidth: "480px",
        width: "100%",
        padding: "0",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(109, 40, 217, 0.3)",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            color: "var(--t2)",
            padding: "0.5rem",
            zIndex: 10,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--t1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "var(--t2)";
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{
          padding: "2.5rem 2.5rem 2rem",
          background: "linear-gradient(180deg, rgba(109, 40, 217, 0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(109, 40, 217, 0.1)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "var(--r-xl)",
              background: "linear-gradient(135deg, var(--pyth), var(--pyth-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(109, 40, 217, 0.4)",
            }}>
              <Wallet size={28} color="#fff" strokeWidth={2.5} />
            </div>
          </div>

          <h2 style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            textAlign: "center",
            color: "var(--t1)",
          }}>
            Connect Wallet
          </h2>
          <p style={{
            color: "var(--t3)",
            fontSize: "0.9375rem",
            textAlign: "center",
          }}>
            Choose your preferred wallet to get started
          </p>
        </div>

        {/* Wallet options */}
        <div style={{ padding: "2rem" }}>
          {error && (
            <div style={{
              padding: "1rem",
              borderRadius: "var(--r-lg)",
              background: "rgba(255, 77, 106, 0.1)",
              border: "1px solid rgba(255, 77, 106, 0.3)",
              color: "var(--coral)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            {connectors.map((connector) => {
              const isConnecting = connecting === connector.id;
              const description = getConnectorDescription(connector.id);

              return (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector.id)}
                  disabled={isConnecting}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--r-lg)",
                    background: "linear-gradient(135deg, rgba(109, 40, 217, 0.08), rgba(109, 40, 217, 0.03))",
                    border: "1px solid rgba(109, 40, 217, 0.2)",
                    cursor: isConnecting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    opacity: isConnecting ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isConnecting) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(109, 40, 217, 0.15), rgba(109, 40, 217, 0.08))";
                      e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.4)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(109, 40, 217, 0.08), rgba(109, 40, 217, 0.03))";
                    e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Wallet Icon */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--r-md)",
                    background: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {connector.icon ? (
                      (() => {
                        const iconSrc = connector.icon.trim();
                        return iconSrc.startsWith('data:') ? (
                          // Use regular img for base64 data URIs
                          <img
                            src={iconSrc}
                            alt={connector.name}
                            width={32}
                            height={32}
                            style={{ borderRadius: "var(--r-sm)" }}
                          />
                        ) : (
                          // Use Next.js Image for external URLs
                          <Image
                            src={iconSrc}
                            alt={connector.name}
                            width={32}
                            height={32}
                            style={{ borderRadius: "var(--r-sm)" }}
                          />
                        );
                      })()
                    ) : (
                      <Wallet size={24} color="var(--t2)" />
                    )}
                  </div>
                  
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--t1)",
                      marginBottom: "0.25rem",
                    }}>
                      {connector.name}
                    </div>
                    <div style={{
                      fontSize: "0.8125rem",
                      color: "var(--t3)",
                    }}>
                      {isConnecting ? "Connecting..." : description}
                    </div>
                  </div>
                  <ExternalLink size={18} color="var(--t3)" />
                </button>
              );
            })}
          </div>

          {/* Info box */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "var(--r-lg)",
            background: "rgba(170, 255, 0, 0.05)",
            border: "1px solid rgba(170, 255, 0, 0.15)",
          }}>
            <p style={{
              fontSize: "0.8125rem",
              color: "var(--t3)",
              lineHeight: 1.6,
              margin: 0,
            }}>
              💡 <strong style={{ color: "var(--lime)" }}>New to wallets?</strong> We recommend MetaMask for beginners. Download it from{" "}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--lime)", textDecoration: "underline" }}
              >
                metamask.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
