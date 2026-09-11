const form = document.getElementById("formRegistro");

const rutInput = document.getElementById("regInputRut");
const nombreInput = document.getElementById("regInputNombre");
const apellidoInput = document.getElementById("regInputApellido");
const correoInput = document.getElementById("regInputCorreo");
const telefonoInput = document.getElementById("regInputTel");
const passInput = document.getElementById("regInputPass");
const cPassInput = document.getElementById("regInputCPass");

const validarRun = reglaRun();

form.addEventListener('submit', (e) => {
    // Evitamos que se envie de una el archivo y 
    // recargue la pagina perdiendo los datos
    e.preventDefault()

    // Vamos a suponer que el formulario está correcto al 100%
    // Haremos verificaciones y lo cambiamos a false
    let esValido = true;

    // Obtenemos todos los y cada uno de los tipos de errores que existen
    // Lo más optimo es ir obteniendolos uno, pero para la facilidad de la programación y visualización
    // de codigo los pondremos todos al principio

    // ¡¡¡¡¡¡¡¡¡¡ Esta wea quedó pendiente !!!!!!!
    if (rutInput.value.trim() === ""){
        mostrarErrorCampo(rutInput, )
    }

});




// FUNCIONES PARA EL MANEJO DE ERRORES EN EL HTML
function esconderError(inputElement, errorElement){
    // Eliminamos los colores de error al input
    inputElement.classList.remove('campo__control--error');

    //Hacer que ahora errorElement se esconda
    if (errorElement){
        errorElement.hidden = true;
        errorElement.textContent = '';
    }
}
