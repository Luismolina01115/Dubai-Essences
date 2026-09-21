const bagButton = document.querySelector('.bag-button');
const bagCount = document.querySelector('#bag-count');
const productButtons = document.querySelectorAll('.product-button');
const registrationForm = document.getElementById('client-form');
const formMessage = document.getElementById('form-message');
const scrollButtons = document.querySelectorAll('[data-scroll]');
const clearBagButton = document.getElementById('clear-bag-button');


const STORAGE_KEYS = {
    cart: 'perfumesCarvajalCart',
    clients: 'perfumesCarvajalClients'
};

const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');
const clients = JSON.parse(localStorage.getItem(STORAGE_KEYS.clients) || '[]');
const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseClient = supabaseConfig.url && supabaseConfig.anonKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

const updateBag = () => {
    bagCount.textContent = String(cart.length);
    bagButton.classList.toggle('is-selected', cart.length > 0);
    if (clearBagButton) {
        clearBagButton.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
};

const saveClientLocally = (client) => {
    clients.push(client);
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
};

const emailExistsInLocalStorage = (email) => clients.some((item) => item.email.toLowerCase() === email.toLowerCase());

productButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const card = button.closest('.product-card');
        const product = {
            name: card.dataset.name,
            price: Number(card.dataset.price),
            id: `${card.dataset.name}-${Date.now()}`
        };

        cart.push(product);
        updateBag();

        button.textContent = 'Añadido';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = 'Añadir';
            button.disabled = false;
        }, 700);
    });
});

bagButton.addEventListener('click', () => {
    if (cart.length > 0) {
        document.getElementById('coleccion').scrollIntoView({ behavior: 'smooth' });
    }
});

scrollButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.dataset.scroll;
        const target = document.querySelector(targetId);

        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registrationForm);
    const password = formData.get('password').toString().trim();
    const client = {
        id: Date.now(),
        name: formData.get('name').toString().trim(),
        email: formData.get('email').toString().trim(),
        phone: formData.get('phone').toString().trim(),
        createdAt: new Date().toISOString()
    };

    if (!client.name || !client.email || !client.phone || !password) {
        formMessage.textContent = 'Completa todos los campos para continuar.';
        return;
    }

    if (emailExistsInLocalStorage(client.email)) {
        formMessage.textContent = 'Este email ya está registrado.';
        return;
    }

    if (supabaseClient) {
        try {
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: client.email.toLowerCase(),
                password,
                options: {
                    data: {
                        name: client.name,
                        phone: client.phone
                    }
                }
            });

            if (authError) {
                console.error('Error al crear la cuenta:', authError);
                const errorMessage = authError.message.toLowerCase();
                formMessage.textContent = errorMessage.includes('already registered')
                    ? 'Este email ya está registrado.'
                    : errorMessage.includes('password')
                        ? 'La contraseña debe tener al menos 6 caracteres.'
                        : errorMessage.includes('invalid') && errorMessage.includes('email')
                            ? 'Escribe un email válido.'
                            : 'No se pudo crear la cuenta: ' + authError.message;
                return;
            }

            if (!authData.user) {
                formMessage.textContent = 'Cuenta creada. Revisa tu email para confirmarla.';
                registrationForm.reset();
                return;
            }

            const { error: profileError } = await supabaseClient.from('clients').insert([{
    name: client.name,
    email: client.email.toLowerCase(),
    phone: client.phone
}]);


            if (profileError) {
                console.error('Error al guardar los datos del cliente:', profileError);
                formMessage.textContent = 'La cuenta se creó, pero faltan los datos del cliente: ' + profileError.message;
                return;
            }

            saveClientLocally(client);
            formMessage.textContent = 'Cliente registrado correctamente. Revisa tu email si pide confirmación.';
            registrationForm.reset();
        } catch (error) {
            console.error('Error de conexión con Supabase:', error);
            formMessage.textContent = 'No se pudo conectar con la base de datos. Comprueba tu conexión e inténtalo de nuevo.';
        }
        return;
    }

    saveClientLocally(client);
    formMessage.textContent = 'Cliente registrado correctamente.';
    registrationForm.reset();
});

updateBag();
// Evento para el botón de vaciar la bolsa al final del archivo
if (clearBagButton) {
    clearBagButton.addEventListener('click', () => {
        cart.length = 0; // Vacía la lista
        updateBag();     // Actualiza todo (y esconde el botón automáticamente)
    });
}

// --- CONFIGURACIÓN DE LOGIN Y SESIONES EN DUBAI ESSENCES ---

// Ejecutar inmediatamente cuando la página cargue para verificar si hay sesión activa
document.addEventListener("DOMContentLoaded", () => {
    verificarSesionActiva();

    // Vincular tu formulario de registro actual (#client-form)
    const formRegistro = document.getElementById("client-form");
    if (formRegistro) {
        formRegistro.addEventListener("submit", procesarRegistro);
    }
});

// 1. Modificar la función de Registro para que inicie sesión automáticamente
function procesarRegistro(event) {
    event.preventDefault(); // Detener el envío clásico de la página

    // Capturar datos usando los nombres de tus inputs actuales
    const form = event.target;
    const nombre = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const telefono = form.querySelector('[name="phone"]').value;
    const password = form.querySelector('[name="password"]').value;
    const formMessage = document.getElementById("form-message");

    // Guardar los datos en el navegador simulando una base de datos local
    const datosUsuario = { nombre, email, telefono, password };
    localStorage.setItem(email, JSON.stringify(datosUsuario));
    
    // Iniciar la sesión marcando a este usuario como "logueado"
    localStorage.setItem("usuarioLogueado", JSON.stringify(datosUsuario));

    // Mostrar mensaje de éxito en tu etiqueta actual de mensajes
    if (formMessage) {
        formMessage.textContent = "¡Usuario registrado e inicio de sesión exitoso!";
        formMessage.style.color = "green";
    }

    form.reset(); // Limpiar el formulario
    verificarSesionActiva(); // Actualizar la pantalla de inmediato
}

// 2. Proceso de Login para clientes que regresan
function procesarLogin(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    // Busquemos el input de contraseña que agregaste en el modal
    const password = document.querySelector('#form-login input[type="password"]').value;

    // Buscar si el correo existe en nuestro almacenamiento local
    const usuarioRegistrado = localStorage.getItem(email);

    if (usuarioRegistrado) {
        const datos = JSON.parse(usuarioRegistrado);

        // Validar si la contraseña introducida coincide con la guardada
        if (datos.password === password) {
            localStorage.setItem("usuarioLogueado", JSON.stringify(datos));
            alert(`¡Bienvenido de nuevo, ${datos.nombre}!`);
            cerrarModalLogin();
            verificarSesionActiva(); // Cambia la barra de navegación
        } else {
            alert("Contraseña incorrecta. Por favor, vuelve a intentarlo.");
        }
    } else {
        alert("Este correo electrónico no está registrado.");
    }
}

// 3. Función inteligente que cambia la interfaz (Muestra el nombre o los botones)
function verificarSesionActiva() {
    const usuarioLogueado = localStorage.getItem("usuarioLogueado");
    const divDesconectado = document.getElementById("usuario-desconectado");
    const divConectado = document.getElementById("usuario-conectado");
    const textoNombre = document.getElementById("nombre-usuario-pantalla");

    if (usuarioLogueado) {
        const datos = JSON.parse(usuarioLogueado);
        if (divDesconectado && divConectado && textoNombre) {
            divDesconectado.style.display = "none";
            divConectado.style.display = "inline-block";
            textoNombre.innerText = `¡Bienvenido, ${datos.nombre}! ✨ `;
        }
    } else {
        if (divDesconectado && divConectado) {
            divDesconectado.style.display = "inline-block";
            divConectado.style.display = "none";
        }
    }
}

// 4. Cerrar Sesión de usuario
function cerrarSesion() {
    localStorage.removeItem("usuarioLogueado"); // Borrar la sesión activa
    alert("Has cerrado sesión.");
    verificarSesionActiva(); // Restablecer botones normales en pantalla
}

// 5. Controladores para abrir y cerrar el Modal flotante de Login
function mostrarModalLogin() {
    const modal = document.getElementById("modal-login");
    if (modal) modal.style.display = "flex";
}

function cerrarModalLogin() {
    const modal = document.getElementById("modal-login");
    if (modal) modal.style.display = "none";
}
// --- INTERACTIVIDAD DEL MENÚ HAMBURGUESA DE DUBAI ESSENCES ---

document.addEventListener("DOMContentLoaded", () => {
    const btnHamburguesa = document.getElementById("btn-hamburguesa");
    const btnCerrarMenu = document.getElementById("btn-cerrar-menu");
    const menuPrincipal = document.getElementById("menu-principal");

    // Abrir el menú lateral al hacer clic en las 3 líneas
    if (btnHamburguesa && menuPrincipal) {
        btnHamburguesa.addEventListener("click", () => {
            menuPrincipal.classList.add("activo");
        });
    }

    // Cerrar el menú lateral al hacer clic en la "X"
    if (btnCerrarMenu && menuPrincipal) {
        btnCerrarMenu.addEventListener("click", () => {
            menuPrincipal.classList.remove("activo");
        });
    }
});

// Función para cerrar el menú automáticamente al hacer clic en una sección
function cerrarMenu() {
    const menuPrincipal = document.getElementById("menu-principal");
    if (menuPrincipal) {
        menuPrincipal.classList.remove("activo");
    }
}
