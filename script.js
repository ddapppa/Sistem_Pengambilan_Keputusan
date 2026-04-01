let alternatif = [];
const tableMentahBody = document.querySelector('#tableMentah tbody');

// Bobot tiap kriteria bisa kamu ubah di sini
// Total akan dinormalisasi otomatis
const bobotKriteria = {
  k1: 1, // IPK
  k2: 1, // Penghasilan Orang Tua
  k3: 1, // Tanggungan Orang Tua
  k4: 1, // Prestasi
  k5: 1  // Semester
};

// Definisi tipe kriteria
// benefit = makin besar makin baik
// cost = makin kecil makin baik
const tipeKriteria = {
  k1: 'benefit',
  k2: 'cost',
  k3: 'benefit',
  k4: 'benefit',
  k5: 'benefit'
};

// Mencegah form reload page
document.getElementById('formAlternatif').addEventListener('submit', function(e) {
  e.preventDefault();

  const nama = document.getElementById('nama').value.trim();
  const ipk = parseFloat(document.getElementById('ipk').value);
  const penghasilan = parseInt(document.getElementById('penghasilan').value, 10);
  const tanggungan = parseInt(document.getElementById('tanggungan').value, 10);
  const prestasi = document.getElementById('prestasi').value;
  const semester = parseInt(document.getElementById('semester').value, 10);

  if (!nama || isNaN(ipk) || isNaN(penghasilan) || isNaN(tanggungan) || isNaN(semester)) {
    alert('Mohon isi semua data dengan benar.');
    return;
  }

  alternatif.push({ nama, ipk, penghasilan, tanggungan, prestasi, semester });
  renderTableMentah();
  this.reset();
  document.getElementById('cardHasil').style.display = 'none';
});

document.getElementById('btnReset').addEventListener('click', () => {
  alternatif = [];
  renderTableMentah();
  document.getElementById('cardHasil').style.display = 'none';
  document.getElementById('containerBobot').innerHTML = '';
  document.getElementById('containerPrefKriteria').innerHTML = '';
  document.getElementById('containerPi').innerHTML = '';
  document.getElementById('containerFlow').innerHTML = '';
  document.getElementById('kesimpulanText').innerHTML = '';
});

function renderTableMentah() {
  tableMentahBody.innerHTML = '';
  alternatif.forEach((a, i) => {
    tableMentahBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${a.nama}</strong></td>
        <td>${a.ipk.toFixed(2)}</td>
        <td>Rp. ${a.penghasilan.toLocaleString('id-ID')}</td>
        <td>${a.tanggungan}</td>
        <td>${a.prestasi}</td>
        <td>${a.semester}</td>
        <td><button class="btn btn-sm btn-danger" onclick="hapusData(${i})">Hapus</button></td>
      </tr>
    `;
  });
}

function hapusData(index) {
  alternatif.splice(index, 1);
  renderTableMentah();
  document.getElementById('cardHasil').style.display = 'none';
}

function getBobotIPK(val) {
  if (val <= 3.00) return 1;
  if (val <= 3.15) return 2;
  if (val <= 3.30) return 3;
  if (val <= 3.55) return 4;
  return 5;
}

function getBobotPenghasilan(val) {
  if (val <= 1000000) return 1;
  if (val <= 2000000) return 2;
  if (val <= 3000000) return 3;
  if (val <= 4000000) return 4;
  return 5;
}

function getBobotTanggungan(val) {
  if (val <= 1) return 1;
  if (val === 2) return 2;
  if (val === 3) return 3;
  if (val === 4) return 4;
  return 5;
}

function getBobotPrestasi(val) {
  if (val === 'Tanpa Prestasi') return 1;
  if (val === 'Prestasi Daerah') return 2;
  if (val === 'Prestasi Provinsi') return 3;
  if (val === 'Prestasi Nasional') return 4;
  return 5;
}

function preferensiUsual(a, b, tipe) {
  if (tipe === 'benefit') return a > b ? 1 : 0;
  if (tipe === 'cost') return a < b ? 1 : 0;
  return 0;
}

document.getElementById('btnHitung').addEventListener('click', () => {
  if (alternatif.length < 2) {
    alert('Minimal masukkan 2 alternatif data!');
    return;
  }

  document.getElementById('cardHasil').style.display = 'block';
  const n = alternatif.length;

  const totalBobot = Object.values(bobotKriteria).reduce((a, b) => a + b, 0);
  const w = {
    k1: bobotKriteria.k1 / totalBobot,
    k2: bobotKriteria.k2 / totalBobot,
    k3: bobotKriteria.k3 / totalBobot,
    k4: bobotKriteria.k4 / totalBobot,
    k5: bobotKriteria.k5 / totalBobot
  };

  // 1. Konversi ke bobot
  const dataBobot = alternatif.map(a => ({
    nama: a.nama,
    k1: getBobotIPK(a.ipk),
    k2: getBobotPenghasilan(a.penghasilan),
    k3: getBobotTanggungan(a.tanggungan),
    k4: getBobotPrestasi(a.prestasi),
    k5: a.semester
  }));

  // Tabel bobot
  let htmlBobot = `
    <table class="table table-bordered text-center table-result">
      <thead>
        <tr>
          <th>Alternatif</th>
          <th>K1 (IPK)</th>
          <th>K2 (Penghasilan)</th>
          <th>K3 (Tanggungan)</th>
          <th>K4 (Prestasi)</th>
          <th>K5 (Semester)</th>
        </tr>
      </thead>
      <tbody>
  `;
  dataBobot.forEach(b => {
    htmlBobot += `
      <tr>
        <td><strong>${b.nama}</strong></td>
        <td>${b.k1}</td>
        <td>${b.k2}</td>
        <td>${b.k3}</td>
        <td>${b.k4}</td>
        <td>${b.k5}</td>
      </tr>
    `;
  });
  htmlBobot += `</tbody></table>`;
  document.getElementById('containerBobot').innerHTML = htmlBobot;

  // 2. Matriks preferensi per kriteria
  const kriteriaKeys = ['k1', 'k2', 'k3', 'k4', 'k5'];
  const kriteriaNames = ['K1 - IPK', 'K2 - Penghasilan', 'K3 - Tanggungan', 'K4 - Prestasi', 'K5 - Semester'];
  const prefMatrix = [];

  let htmlPref = '';

  for (let k = 0; k < 5; k++) {
    const key = kriteriaKeys[k];
    const tipe = tipeKriteria[key];
    const matrixK = Array.from({ length: n }, () => Array(n).fill(0));

    let tableK = `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#k${k}">
            Matriks ${kriteriaNames[k]}
          </button>
        </h2>
        <div id="k${k}" class="accordion-collapse collapse" data-bs-parent="#containerPrefKriteria">
          <div class="accordion-body table-responsive">
            <table class="table table-bordered text-center">
              <thead>
                <tr>
                  <th>Alternatif</th>
    `;

    dataBobot.forEach(a => {
      tableK += `<th>${a.nama}</th>`;
    });

    tableK += `
                </tr>
              </thead>
              <tbody>
    `;

    for (let i = 0; i < n; i++) {
      tableK += `<tr><td><strong>${dataBobot[i].nama}</strong></td>`;
      for (let j = 0; j < n; j++) {
        if (i === j) {
          tableK += `<td class="bg-light">-</td>`;
        } else {
          const diff = dataBobot[i][key] - dataBobot[j][key];
          let p = 0;

          if (tipe === 'benefit') {
            p = diff > 0 ? 1 : 0;
          } else if (tipe === 'cost') {
            p = diff < 0 ? 1 : 0;
          }

          matrixK[i][j] = p;
          tableK += `<td>${p}</td>`;
        }
      }
      tableK += `</tr>`;
    }

    tableK += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    htmlPref += tableK;
    prefMatrix.push(matrixK);
  }

  document.getElementById('containerPrefKriteria').innerHTML = htmlPref;

  // 3. Matriks indeks preferensi agregat
  const piMatrix = Array.from({ length: n }, () => Array(n).fill(0));

  let htmlPi = `<table class="table table-bordered text-center table-result"><thead><tr><th>Alternatif</th>`;
  dataBobot.forEach(a => htmlPi += `<th>${a.nama}</th>`);
  htmlPi += `</tr></thead><tbody>`;

  for (let i = 0; i < n; i++) {
    htmlPi += `<tr><td><strong>${dataBobot[i].nama}</strong></td>`;
    for (let j = 0; j < n; j++) {
      if (i === j) {
        htmlPi += `<td class="bg-light">-</td>`;
      } else {
        let sum = 0;
        sum += w.k1 * prefMatrix[0][i][j];
        sum += w.k2 * prefMatrix[1][i][j];
        sum += w.k3 * prefMatrix[2][i][j];
        sum += w.k4 * prefMatrix[3][i][j];
        sum += w.k5 * prefMatrix[4][i][j];

        piMatrix[i][j] = sum;
        htmlPi += `<td>${sum.toFixed(3)}</td>`;
      }
    }
    htmlPi += `</tr>`;
  }

  htmlPi += `</tbody></table>`;
  document.getElementById('containerPi').innerHTML = htmlPi;

  // 4. Leaving, Entering, Net Flow
  const hasilAkhir = [];

  for (let i = 0; i < n; i++) {
    let leaving = 0;
    let entering = 0;

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        leaving += piMatrix[i][j];
        entering += piMatrix[j][i];
      }
    }

    leaving = leaving / (n - 1);
    entering = entering / (n - 1);
    const net = leaving - entering;

    hasilAkhir.push({
      nama: dataBobot[i].nama,
      leaving,
      entering,
      net
    });
  }

  hasilAkhir.sort((a, b) => b.net - a.net);

  let htmlFlow = `
    <table class="table table-bordered text-center table-result align-middle">
      <thead>
        <tr>
          <th>Peringkat</th>
          <th>Alternatif</th>
          <th>Leaving Flow (+)</th>
          <th>Entering Flow (-)</th>
          <th>Net Flow</th>
        </tr>
      </thead>
      <tbody>
  `;

  hasilAkhir.forEach((h, idx) => {
    const badge = idx === 0 ? 'bg-warning text-dark px-2 py-1 rounded' : '';
    htmlFlow += `
      <tr>
        <td><strong class="fs-5">${idx + 1}</strong></td>
        <td><span class="${badge} fw-bold">${h.nama}</span></td>
        <td>${h.leaving.toFixed(4)}</td>
        <td>${h.entering.toFixed(4)}</td>
        <td class="fw-bold">${h.net.toFixed(4)}</td>
      </tr>
    `;
  });

  htmlFlow += `</tbody></table>`;
  document.getElementById('containerFlow').innerHTML = htmlFlow;

  document.getElementById('kesimpulanText').innerHTML =
    `🏆 Kesimpulan: Berdasarkan perhitungan Net Flow tertinggi, alternatif terbaik adalah <strong>${hasilAkhir[0].nama}</strong>.`;

  document.getElementById('cardHasil').scrollIntoView({ behavior: 'smooth' });
});
