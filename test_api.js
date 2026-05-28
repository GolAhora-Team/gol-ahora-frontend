const fetch = require('node-fetch');

async function testApi() {
  const payload = {
    email: "8888888",
    password: "1234",
    request: {
      dni: 8888888,
      nombre: "Test8",
      apellido: "Test",
      genero: "MASCULINO",
      fechaNacimiento: "1990-01-01T00:00:00Z",
      telefono: "12345678",
      direccion: "Calle Falsa",
      localidad: "La Plata",
      codigoPostal: "1900",
      provincia: "BA",
      pais: "Arg",
      contactoEmergencia: "0",
      email: "test8@test.com",
      especialidad: "Tenis",
      certificacion: "Ninguna"
    }
  };

  try {
    const res = await fetch('http://golahora.runasp.net/api/User/Profesor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response:", text);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}

testApi();
