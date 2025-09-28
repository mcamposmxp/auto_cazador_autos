import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface CredencialesProfesionalProps {
  nombreProfesional: string
  nombreNegocio: string
  email: string
  password: string
  panelUrl: string
}

export const CredencialesProfesional = ({
  nombreProfesional,
  nombreNegocio,
  email,
  password,
  panelUrl,
}: CredencialesProfesionalProps) => (
  <Html>
    <Head />
    <Preview>Credenciales de acceso al sistema de ofertas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>¡Bienvenido al Sistema de Ofertas!</Heading>
        
        <Text style={text}>
          Hola <strong>{nombreProfesional}</strong>,
        </Text>
        
        <Text style={text}>
          Te damos la bienvenida al sistema de ofertas para profesionales. 
          Tu empresa <strong>{nombreNegocio}</strong> ha sido registrada exitosamente 
          y ya puedes acceder al panel de profesionales.
        </Text>

        <Section style={credentialsSection}>
          <Heading style={h2}>Tus credenciales de acceso</Heading>
          
          <Text style={credentialItem}>
            <strong>Usuario:</strong> {email}
          </Text>
          
          <Text style={credentialItem}>
            <strong>Contraseña temporal:</strong>
          </Text>
          <code style={passwordCode}>{password}</code>
          
          <Text style={credentialItem}>
            <strong>Panel de acceso:</strong>
          </Text>
          <Link
            href={panelUrl}
            target="_blank"
            style={accessButton}
          >
            Acceder al Panel de Profesionales
          </Link>
        </Section>

        <Hr style={hr} />

        <Section style={instructionsSection}>
          <Heading style={h3}>Instrucciones importantes:</Heading>
          <Text style={instructionText}>
            1. <strong>Cambia tu contraseña:</strong> Por seguridad, te recomendamos cambiar tu contraseña temporal en tu primer acceso.
          </Text>
          <Text style={instructionText}>
            2. <strong>Guarda tus credenciales:</strong> Mantén tus datos de acceso en un lugar seguro.
          </Text>
          <Text style={instructionText}>
            3. <strong>Explora el panel:</strong> En tu panel podrás ver autos disponibles, enviar ofertas y dar seguimiento a tus negociaciones.
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footerText}>
          Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.
        </Text>
        
        <Text style={warningText}>
          Si no esperabas recibir este correo, puedes ignorarlo de forma segura.
        </Text>
        
        <Text style={footer}>
          Sistema de Ofertas Profesionales<br />
          Plataforma de compra-venta de vehículos
        </Text>
      </Container>
    </Body>
  </Html>
)

export default CredencialesProfesional

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 20px 0',
}

const h3 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '20px 0 10px 0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const credentialsSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
}

const credentialItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const passwordCode = {
  display: 'inline-block',
  padding: '12px 16px',
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  borderRadius: '6px',
  fontSize: '16px',
  fontFamily: 'monospace',
  letterSpacing: '1px',
  margin: '8px 0',
  fontWeight: 'bold',
}

const accessButton = {
  backgroundColor: '#007cba',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '16px 0',
}

const instructionsSection = {
  margin: '32px 40px',
}

const instructionText = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const hr = {
  borderColor: '#e9ecef',
  margin: '20px 40px',
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
}

const warningText = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  padding: '0 40px',
  fontStyle: 'italic',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '48px 0 0 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}