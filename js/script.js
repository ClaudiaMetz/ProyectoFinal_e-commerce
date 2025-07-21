document.addEventListener("DOMContentLoaded", () => {
  // Cargar productos desde tu API
  fetch("http://localhost:8080/api/productos")
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo conectar con la API de productos");
      }
      return response.json();
    })
    .then((data) => {
      cargarProductos(data);
    })
    .catch((error) =>
      console.error("Error al obtener productos del backend", error)
    );

  function cargarProductos(data) {
    const productosContainer = document.getElementById("productos-container");
    productosContainer.innerHTML = "";

    data.forEach((producto) => {
      const shortDescription =
        producto.descripcion.split(" ").slice(0, 5).join(" ") + "...";

      productosContainer.innerHTML += `
        <div class="card">
          <img src="${producto.imagenUrl}" class="card-img-top" alt="${producto.nombre}">
          <div class="card-body">
            <h5 class="card-title">${producto.nombre}</h5>
            <p class="card-text short-description">${shortDescription}</p>
            <p class="card-text full-description" style="display: none;">${producto.descripcion}</p>
            <button class="btn btn-link" onclick="toggleDescription(this)">Ver descripción</button>
            <p class="card-text">$${producto.precio}</p>
            <button class="btn btn-primary" onclick="addToCart(${producto.id}, '${producto.imagenUrl}', '${producto.nombre}', ${producto.precio}, this)">Agregar al carrito</button>
          </div>
        </div>
      `;
    });
  }

  window.addToCart = function (id, image, title, price, button) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existingProduct = cart.find((product) => product.id === id);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.push({ id, image, title, price, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();

    button.textContent = "Agregado";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = "Agregar al carrito";
      button.disabled = false;
    }, 1000);
  };

  window.toggleDescription = function (button) {
    const shortDescription = button.previousElementSibling;
    const fullDescription = shortDescription.nextElementSibling;
    if (fullDescription.style.display === "none") {
      fullDescription.style.display = "block";
      shortDescription.style.display = "none";
      button.textContent = "Ocultar descripción";
    } else {
      fullDescription.style.display = "none";
      shortDescription.style.display = "block";
      button.textContent = "Ver descripción";
    }
  };

  function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const carritoItems = document.getElementById("carrito-items");
    carritoItems.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      carritoItems.innerHTML =
        '<li class="text-center text-muted w-100">Tu carrito está vacío</li>';
      document.getElementById("realizar-compra").disabled = true;
    } else {
      document.getElementById("realizar-compra").disabled = false;

      cart.forEach((item) => {
        const cartItemHTML = `
          <li class="cart-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="card-body">
              <h6 class="card-title">${item.title}</h6>
              <p class="card-text">Cantidad: <strong>${item.quantity}</strong></p>
              <p class="card-text">Precio unitario: ${item.price}</p>
              <p class="card-text">Subtotal: <strong>${(item.price * item.quantity).toFixed(2)}</strong></p>
              <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id})">Eliminar</button>
            </div>
          </li>
        `;
        carritoItems.innerHTML += cartItemHTML;
        total += item.price * item.quantity;
      });
    }

    document.getElementById("carrito-total").textContent = total.toFixed(2);
    document.getElementById("cart-counter").textContent = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    document.getElementById("cart-counter-nav").textContent = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  window.removeFromCart = function (id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
  };

  document.getElementById("vaciar-carrito").addEventListener("click", () => {
    localStorage.clear();
    updateCartUI();
  });

  document.getElementById("realizar-compra").addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    const pedido = {
      lineas: cart.map((item) => ({
        productoId: item.id,
        cantidad: item.quantity,
      })),
    };

    fetch("http://localhost:8080/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pedido),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((msg) => {
            throw new Error(msg);
          });
        }
        return response.json();
      })
      .then((data) => {
        const total = data.total || 0;
        document.getElementById("modal-total").textContent = total.toFixed(2);
        const modal = new bootstrap.Modal(
          document.getElementById("compraExitosaModal")
        );
        modal.show();
        localStorage.clear();
        updateCartUI();
      })
      .catch((error) => {
        alert(`Error al realizar el pedido: ${error.message}`);
      });
  });

  updateCartUI();
});
