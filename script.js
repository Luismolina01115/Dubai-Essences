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

