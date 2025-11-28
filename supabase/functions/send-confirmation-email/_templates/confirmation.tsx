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
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>Confirma tu correo electrónico para activar tu cuenta de Chamby</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://chamby.mx/chamby-logo.png"
            alt="Chamby"
            width="120"
            height="auto"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Confirma tu correo electrónico</Heading>
        
        <Text style={text}>
          Hola,
        </Text>
        
        <Text style={text}>
          Recibimos una solicitud para crear una cuenta en Chamby con este correo electrónico.
        </Text>
        
        <Text style={text}>
          Para activar tu cuenta, haz clic en el siguiente botón:
        </Text>
        
        <Section style={buttonSection}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Confirmar correo electrónico
          </Link>
        </Section>
        
        <Text style={text}>
          O usa este código de verificación:
        </Text>
        
        <Section style={codeSection}>
          <Text style={code}>{token}</Text>
        </Section>
        
        <Text style={smallText}>
          Este código expira en 24 horas.
        </Text>
        
        <Section style={divider} />
        
        <Text style={smallText}>
          Si no creaste una cuenta en Chamby, puedes ignorar este mensaje.
        </Text>
        
        <Section style={divider} />
        
        <Text style={footer}>
          Este es un correo automático de verificación.<br />
          Chamby - chamby.mx
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
  display: 'block',
  textAlign: 'center' as const,
  padding: '16px 24px',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #e1e1e1',
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  letterSpacing: '4px',
  fontFamily: 'Monaco, Courier, monospace',
  margin: '0',
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
