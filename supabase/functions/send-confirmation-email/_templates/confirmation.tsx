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
    <Head />
    <Preview>¡Bienvenido a Chamby! Confirma tu correo electrónico</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://uiyjmjibshnkhwewtkoz.supabase.co/storage/v1/object/public/avatars/chamby-logo.png"
            alt="Chamby"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>¡Bienvenido a Chamby! 👋</Heading>
        
        <Text style={text}>
          Gracias por registrarte en Chamby, tu plataforma de confianza para conectar con profesionales verificados.
        </Text>
        
        <Text style={text}>
          Para completar tu registro y comenzar a disfrutar de nuestros servicios, confirma tu correo electrónico:
        </Text>
        
        <Section style={buttonSection}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Confirmar mi correo
          </Link>
        </Section>
        
        <Text style={text}>
          O copia y pega este código de confirmación:
        </Text>
        
        <Section style={codeSection}>
          <code style={code}>{token}</code>
        </Section>
        
        <Text style={smallText}>
          Este enlace y código son válidos por 24 horas.
        </Text>
        
        <Section style={divider} />
        
        <Text style={text}>
          <strong>¿Qué puedes hacer en Chamby?</strong>
        </Text>
        
        <Text style={text}>
          ✅ Encuentra profesionales verificados cerca de ti<br />
          ✅ Agenda servicios de forma rápida y segura<br />
          ✅ Paga de manera protegida<br />
          ✅ Califica y comparte tu experiencia
        </Text>
        
        <Text style={smallText}>
          Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
        </Text>
        
        <Section style={divider} />
        
        <Text style={footer}>
          © 2025 Chamby - Conectando profesionales con clientes<br />
          <Link href="https://chamby.app" style={footerLink}>
            chamby.app
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  width: '120px',
  height: 'auto',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  lineHeight: '1.3',
  textAlign: 'center' as const,
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
}

const smallText = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const codeSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #e1e1e1',
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  fontFamily: 'monospace',
}

const divider = {
  borderTop: '1px solid #e1e1e1',
  margin: '32px 0',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerLink = {
  color: '#6366f1',
  textDecoration: 'none',
}
