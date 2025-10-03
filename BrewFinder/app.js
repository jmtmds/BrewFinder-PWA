document.addEventListener("DOMContentLoaded", () => {
    const GOOGLE_MAPS_API_KEY = "AIzaSyAO36tlR0f1hppNesoxqxf1JFEw63HvsS8";

    const searchForm = document.getElementById("searchForm");
    const cityInput = document.getElementById("cityInput");
    const findBtn = document.getElementById("findBtn");
    const apiBtn = document.getElementById("apiBtn");
    const breweryList = document.getElementById("breweryList");
    const mapsStatus = document.getElementById("mapsStatus");
    const apiStatus = document.getElementById("apiStatus");
    const mapContainer = document.getElementById("mapContainer");
    const visitedForm = document.getElementById("visitedForm");
    const breweryNameInput = document.getElementById("breweryName");
    const breweryNotesInput = document.getElementById("breweryNotes");
    const breweryPhotoInput = document.getElementById("breweryPhoto");
    const photoPreview = document.getElementById("photoPreview");
    const visitedList = document.getElementById("visitedList");
    const visitedStatus = document.getElementById("visitedStatus");

    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraModal = document.getElementById('cameraModal');
    const cameraFeed = document.getElementById('cameraFeed');
    const photoCanvas = document.getElementById('photoCanvas');
    const captureControls = document.getElementById('captureControls');
    const previewControls = document.getElementById('previewControls');
    const captureBtn = document.getElementById('captureBtn');
    const cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    let stream = null;
    let capturedImageData = null;

    searchForm.addEventListener("submit", handleSearchForm);
    findBtn.addEventListener("click", handleFindMe);
    apiBtn.addEventListener("click", handleApiRequest);
    visitedForm.addEventListener("submit", handleSaveVisit);
    breweryPhotoInput.addEventListener("change", handlePhotoFile);
    openCameraBtn.addEventListener('click', startCamera);
    cancelCaptureBtn.addEventListener('click', stopCamera);
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    confirmBtn.addEventListener('click', confirmPhoto);

    loadVisitedBreweries();

    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add("loading");
            button.disabled = true;
        } else {
            button.classList.remove("loading");
            button.disabled = false;
        }
    }

    function handleSearchForm(e) {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            displayGoogleMap(city);
        }
    }

    function handleFindMe() {
        if (!navigator.geolocation) {
            updateStatus(mapsStatus, "Geolocalização não é suportada pelo seu navegador.", "error");
            return;
        }
        updateStatus(mapsStatus, "Obtendo sua localização...", "info");
        navigator.geolocation.getCurrentPosition(
            (position) => displayGoogleMap(null, position.coords),
            () => updateStatus(mapsStatus, "Não foi possível obter sua localização.", "error")
        );
    }

    function displayGoogleMap(city = null, coords = null) {
        if (GOOGLE_MAPS_API_KEY === "SUA_CHAVE_DE_API_VAI_AQUI") {
            updateStatus(mapsStatus, "A chave de API do Google Maps não foi configurada.", "error");
            return;
        }

        let query;
        if (city) {
            query = `Cervejarias em ${city}`;
        } else if (coords) {
            query = `Cervejarias perto de ${coords.latitude},${coords.longitude}`;
        } else {
            return;
        }

        const url = `https://www.google.com/maps/embed/v1/search?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(query)}`;

        mapContainer.innerHTML = `<iframe src="${url}" loading="lazy" allowfullscreen></iframe>`;
        mapContainer.classList.remove('hidden');
        updateStatus(mapsStatus, "");
    }


    async function handleApiRequest() {
        setLoadingState(apiBtn, true);
        updateStatus(apiStatus, "Buscando cervejarias aleatórias no mundo...", "info");
        breweryList.innerHTML = "";
        try {
            const response = await fetch("https://api.openbrewerydb.org/v1/breweries/random?size=10");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const breweries = await response.json();
            displayBreweries(breweries);
            updateStatus(apiStatus, "");
        } catch (error) {
            console.error("Erro ao buscar cervejarias:", error);
            updateStatus(apiStatus, "Não foi possível buscar as cervejarias. Tente novamente mais tarde.", "error");
        } finally {
            setLoadingState(apiBtn, false);
        }
    }

    function displayBreweries(breweries) {
        if (breweries.length === 0) {
            updateStatus(apiStatus, "Nenhuma cervejaria encontrada.", "info");
            return;
        }
        const html = breweries.map(brewery => `
            <div class="brewery-card">
                <h3>${brewery.name}</h3>
                <p class="type">${brewery.brewery_type || 'N/A'}</p>
                <p><svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> ${[brewery.city, brewery.state, brewery.country].filter(Boolean).join(', ')}</p>
                ${brewery.website_url ? `<p><svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> <a href="${brewery.website_url}" target="_blank">Visitar site</a></p>` : ''}
            </div>
        `).join('');
        breweryList.innerHTML = html;
    }

    function handleSaveVisit(e) {
        e.preventDefault();
        const name = breweryNameInput.value.trim();
        const notes = breweryNotesInput.value.trim();
        const photo = photoPreview.src;

        if (!name) {
            updateStatus(visitedStatus, "O nome da cervejaria é obrigatório.", "error");
            return;
        }

        const visit = { id: Date.now(), name, notes, photo };
        const visits = JSON.parse(localStorage.getItem("visitedBreweries")) || [];
        visits.push(visit);
        localStorage.setItem("visitedBreweries", JSON.stringify(visits));

        loadVisitedBreweries();
        visitedForm.reset();
        photoPreview.style.display = "none";
        photoPreview.src = "";
        capturedImageData = null;
        updateStatus(visitedStatus, "Visita salva com sucesso!", "info");
        setTimeout(() => updateStatus(visitedStatus, ""), 3000);
    }

    function loadVisitedBreweries() {
        const visits = JSON.parse(localStorage.getItem("visitedBreweries")) || [];
        if (visits.length === 0) {
            visitedList.innerHTML = "";
            return;
        }
        const html = visits.map(visit => `
            <div class="visited-brewery-card">
                <button class="delete-btn" data-id="${visit.id}">&times;</button>
                ${visit.photo ? `<img src="${visit.photo}" alt="Foto de ${visit.name}">` : ''}
                <h3>${visit.name}</h3>
                <p>${visit.notes}</p>
            </div>
        `).join('');
        visitedList.innerHTML = html;
        document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", handleDeleteVisit));
    }

    function handleDeleteVisit(e) {
        const idToDelete = parseInt(e.target.dataset.id);
        let visits = JSON.parse(localStorage.getItem("visitedBreweries")) || [];
        visits = visits.filter(visit => visit.id !== idToDelete);
        localStorage.setItem("visitedBreweries", JSON.stringify(visits));
        loadVisitedBreweries();
    }

    function handlePhotoFile() {
        const file = breweryPhotoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    }

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            cameraFeed.srcObject = stream;
            cameraModal.classList.remove('hidden');
            cameraFeed.style.display = 'block';
            photoCanvas.classList.add('hidden');
            captureControls.classList.remove('hidden');
            previewControls.classList.add('hidden');
        } catch (err) {
            console.error("Erro ao acessar a câmera:", err);
            alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        cameraModal.classList.add('hidden');
    }

    function capturePhoto() {
        photoCanvas.width = cameraFeed.videoWidth;
        photoCanvas.height = cameraFeed.videoHeight;
        photoCanvas.getContext('2d').drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);

        capturedImageData = photoCanvas.toDataURL('image/jpeg');

        cameraFeed.style.display = 'none';
        photoCanvas.classList.remove('hidden');
        captureControls.classList.add('hidden');
        previewControls.classList.remove('hidden');
    }

    function retakePhoto() {
        cameraFeed.style.display = 'block';
        photoCanvas.classList.add('hidden');
        captureControls.classList.remove('hidden');
        previewControls.classList.add('hidden');
        capturedImageData = null;
    }

    function confirmPhoto() {
        if (capturedImageData) {
            photoPreview.src = capturedImageData;
            photoPreview.style.display = 'block';
        }
        stopCamera();
    }

    function updateStatus(element, message, type = "info") {
        element.textContent = message;
        element.className = "status-message";
        if (message) {
            element.classList.add(type);
        }
    }
});