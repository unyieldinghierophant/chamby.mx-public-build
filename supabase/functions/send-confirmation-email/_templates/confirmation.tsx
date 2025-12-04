import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>¡Bienvenido a Chamby! Confirma tu correo para comenzar</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Branded Header with Gradient */}
        <Section style={header}>
          <Img
            src="https://chamby.mx/chamby-logo.png"
            alt="Chamby"
            width="140"
            height="auto"
            style={logo}
          />
          <Text style={headerTagline}>Tu plataforma de confianza</Text>
        </Section>
        
        {/* Main Content Card */}
        <Section style={card}>
          <Section style={iconContainer}>
            <Text style={emailIcon}>✉️</Text>
          </Section>
          
          <Heading style={h1}>Confirma tu correo electrónico</Heading>
          
          <Text style={text}>
            ¡Hola! 👋
          </Text>
          
          <Text style={text}>
            Gracias por unirte a <strong style={brandText}>Chamby</strong>. Estás a un paso de conectar con los mejores profesionales verificados cerca de ti.
          </Text>
          
          <Text style={text}>
            Para activar tu cuenta, haz clic en el siguiente botón:
          </Text>
          
          <Section style={buttonSection}>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`}
              style={button}
            >
              Confirmar mi correo electrónico
            </Link>
          </Section>
          
          <Text style={orText}>
            o usa este código de verificación:
          </Text>
          
          <Section style={codeSection}>
            <Text style={code}>{token}</Text>
          </Section>
          
          <Text style={expiryText}>
            ⏱️ Este código expira en 24 horas
          </Text>
          
          <Section style={divider} />
          
          {/* Features Section */}
          <Text style={featuresTitle}>¿Qué puedes hacer en Chamby?</Text>
          
          <Section style={featureRow}>
            <Text style={featureItem}>✓ Encuentra profesionales verificados cerca de ti</Text>
          </Section>
          <Section style={featureRow}>
            <Text style={featureItem}>✓ Agenda servicios de forma rápida y segura</Text>
          </Section>
          <Section style={featureRow}>
            <Text style={featureItem}>✓ Paga de manera protegida</Text>
          </Section>
          <Section style={featureRow}>
            <Text style={featureItem}>✓ Califica y comparte tu experiencia</Text>
          </Section>
          
          <Section style={divider} />
          
          <Text style={smallText}>
            Si no creaste una cuenta en Chamby, puedes ignorar este mensaje de forma segura.
          </Text>
        </Section>
        
        {/* Footer */}
        <Section style={footer}>
          <Img
            src="https://chamby.mx/chamby-logo.png"
            alt="Chamby"
            width="80"
            height="auto"
            style={footerLogo}
          />
          <Text style={footerText}>
            Conectando profesionales con clientes
          </Text>
          <Text style={footerCopyright}>
            © 2025 Chamby · chamby.mx
          </Text>
          <Text style={footerLinks}>
            <Link href="https://chamby.mx" style={footerLink}>Sitio web</Link>
            {' · '}
            <Link href="https://chamby.mx/help" style={footerLink}>Ayuda</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

// Chamby Brand Colors
const chambyBlue = '#1565C0'
const chambyBlueDark = '#0D47A1'
const chambyBlueLight = '#4285F4'

const main = {
  backgroundColor: '#f0f4f8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '20px 0',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
}

const header = {
  background: `linear-gradient(135deg, ${chambyBlue} 0%, ${chambyBlueDark} 100%)`,
  padding: '40px 20px 30px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
}

const logo = {
  margin: '0 auto 12px',
}

const headerTagline = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  letterSpacing: '0.5px',
}

const card = {
  backgroundColor: '#ffffff',
  padding: '40px 32px',
  borderRadius: '0 0 12px 12px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
}

const iconContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const emailIcon = {
  fontSize: '48px',
  margin: '0',
  lineHeight: '1',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
  lineHeight: '1.3',
  textAlign: 'center' as const,
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '16px 0',
}

const brandText = {
  color: chambyBlue,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0 24px',
}

const button = {
  backgroundColor: chambyBlue,
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  boxShadow: `0 4px 14px ${chambyBlue}40`,
}

const orText = {
  color: '#898989',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const codeSection = {
  textAlign: 'center' as const,
  margin: '0 0 16px',
}

const code = {
  display: 'inline-block',
  padding: '18px 32px',
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  border: `2px solid ${chambyBlueLight}40`,
  color: chambyBlue,
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  fontFamily: 'Monaco, Courier, monospace',
  margin: '0',
}

const expiryText = {
  color: '#64748b',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
}

const divider = {
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
}

const featuresTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const featureRow = {
  margin: '8px 0',
}

const featureItem = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  paddingLeft: '8px',
}

const smallText = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}

const footer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
}

const footerLogo = {
  margin: '0 auto 12px',
  opacity: 0.7,
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 8px',
  fontWeight: '500',
}

const footerCopyright = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0 0 12px',
}

const footerLinks = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0',
}

const footerLink = {
  color: chambyBlue,
  textDecoration: 'none',
}
