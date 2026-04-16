// ============================
    // Tax Data (US Federal Brackets)
    // ============================
    const TAX_DATA = {
        2024: {
            brackets: {
                single: [
                    { min: 0, max: 11600, rate: 0.10 },
                    { min: 11600, max: 47150, rate: 0.12 },
                    { min: 47150, max: 100525, rate: 0.22 },
                    { min: 100525, max: 191950, rate: 0.24 },
                    { min: 191950, max: 243725, rate: 0.32 },
                    { min: 243725, max: 609350, rate: 0.35 },
                    { min: 609350, max: Infinity, rate: 0.37 }
                ],
                mfj: [
                    { min: 0, max: 23200, rate: 0.10 },
                    { min: 23200, max: 94300, rate: 0.12 },
                    { min: 94300, max: 201050, rate: 0.22 },
                    { min: 201050, max: 383900, rate: 0.24 },
                    { min: 383900, max: 487450, rate: 0.32 },
                    { min: 487450, max: 731200, rate: 0.35 },
                    { min: 731200, max: Infinity, rate: 0.37 }
                ],
                mfs: [
                    { min: 0, max: 11600, rate: 0.10 },
                    { min: 11600, max: 47150, rate: 0.12 },
                    { min: 47150, max: 100525, rate: 0.22 },
                    { min: 100525, max: 191950, rate: 0.24 },
                    { min: 191950, max: 243725, rate: 0.32 },
                    { min: 243725, max: 365600, rate: 0.35 },
                    { min: 365600, max: Infinity, rate: 0.37 }
                ],
                hoh: [
                    { min: 0, max: 16550, rate: 0.10 },
                    { min: 16550, max: 63100, rate: 0.12 },
                    { min: 63100, max: 100500, rate: 0.22 },
                    { min: 100500, max: 191950, rate: 0.24 },
                    { min: 191950, max: 243700, rate: 0.32 },
                    { min: 243700, max: 609350, rate: 0.35 },
                    { min: 609350, max: Infinity, rate: 0.37 }
                ]
            },
            standardDeductions: { single: 14600, mfj: 29200, mfs: 14600, hoh: 21900 },
            dependentCredit: 2000,
            retirementLimit: 23000
        },
        2023: {
            brackets: {
                single: [
                    { min: 0, max: 11000, rate: 0.10 },
                    { min: 11000, max: 44725, rate: 0.12 },
                    { min: 44725, max: 95375, rate: 0.22 },
                    { min: 95375, max: 182100, rate: 0.24 },
                    { min: 182100, max: 231250, rate: 0.32 },
                    { min: 231250, max: 578125, rate: 0.35 },
                    { min: 578125, max: Infinity, rate: 0.37 }
                ],
                mfj: [
                    { min: 0, max: 22000, rate: 0.10 },
                    { min: 22000, max: 89450, rate: 0.12 },
                    { min: 89450, max: 190750, rate: 0.22 },
                    { min: 190750, max: 364200, rate: 0.24 },
                    { min: 364200, max: 462500, rate: 0.32 },
                    { min: 462500, max: 693750, rate: 0.35 },
                    { min: 693750, max: Infinity, rate: 0.37 }
                ],
                mfs: [
                    { min: 0, max: 11000, rate: 0.10 },
                    { min: 11000, max: 44725, rate: 0.12 },
                    { min: 44725, max: 95375, rate: 0.22 },
                    { min: 95375, max: 182100, rate: 0.24 },
                    { min: 182100, max: 231250, rate: 0.32 },
                    { min: 231250, max: 346875, rate: 0.35 },
                    { min: 346875, max: Infinity, rate: 0.37 }
                ],
                hoh: [
                    { min: 0, max: 15700, rate: 0.10 },
                    { min: 15700, max: 59850, rate: 0.12 },
                    { min: 59850, max: 95350, rate: 0.22 },
                    { min: 95350, max: 182100, rate: 0.24 },
                    { min: 182100, max: 231250, rate: 0.32 },
                    { min: 231250, max: 578100, rate: 0.35 },
                    { min: 578100, max: Infinity, rate: 0.37 }
                ]
            },
            standardDeductions: { single: 13850, mfj: 27700, mfs: 13850, hoh: 20800 },
            dependentCredit: 2000,
            retirementLimit: 22500
        }
    };

    // ============================
    // State
    // ============================
    let currentView = 'yearly';
    let chartBracket = null;
    let chartAllocation = null;
    let lastResult = null;
    const YEAR_RANGE = 5;
    let zipLookupRequestId = 0;

    // ============================
    // Utility Functions
    // ============================
    function fmt(num) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    function fmtFull(num) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    function parseNum(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.\-]/g, '')) || 0;
    }

    function formatInputValue(input) {
        const raw = parseNum(input.value);
        if (raw > 0) {
            input.value = new Intl.NumberFormat('en-US').format(raw);
        } else if (input.value === '' || input.value === '0') {
            input.value = '';
        }
    }

    function monthly(num) {
        return num / 12;
    }

    async function getStateFromZip(zipCode) {
        try {
            const resp = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
            if (!resp.ok) return { state: 'Unknown', stateCode: '' };
            const data = await resp.json();
            const place = data.places && data.places[0] ? data.places[0] : null;
            if (!place) return { state: 'Unknown', stateCode: '' };
            return {
                state: place['state'] || 'Unknown',
                stateCode: place['state abbreviation'] || ''
            };
        } catch (e) {
            return { state: 'Unknown', stateCode: '' };
        }
    }

    async function updateZipStateHint(zipCode) {
        const hintEl = document.getElementById('tcZipStateHint');
        if (!hintEl) return;

        if (!/^\d{5}$/.test(zipCode)) {
            hintEl.hidden = true;
            hintEl.textContent = 'State: —';
            return;
        }

        const requestId = ++zipLookupRequestId;
        hintEl.hidden = false;
        hintEl.textContent = 'State: Loading...';
        const location = await getStateFromZip(zipCode);

        if (requestId !== zipLookupRequestId) return;
        hintEl.hidden = false;
        hintEl.textContent = `State: ${location.state || 'Unknown'}`;
    }

    function getFallbackTaxDataYear(selectedYear) {
        const taxYears = Object.keys(TAX_DATA).map(Number).sort((a, b) => b - a);
        if (!taxYears.length) return null;

        const chosenYear = Number(selectedYear);
        if (taxYears.includes(chosenYear)) return chosenYear;
        if (chosenYear > taxYears[0]) return taxYears[0];
        return taxYears[taxYears.length - 1];
    }

    function populateTaxYearOptions() {
        const currentYear = new Date().getFullYear();
        document.getElementById('tcTaxYear').value = String(currentYear);
    }

    // ============================
    // Input Formatting
    // ============================
    document.querySelectorAll('.tc-input-wrap .form-control').forEach(input => {
        input.addEventListener('focus', function() {
            const raw = parseNum(this.value);
            if (raw > 0) this.value = raw;
        });
        input.addEventListener('blur', function() {
            formatInputValue(this);
        });
        input.addEventListener('keydown', function(e) {
            // Allow: backspace, delete, tab, escape, enter, arrows, period, hyphen
            if ([46, 8, 9, 27, 13, 110, 190, 189].includes(e.keyCode) ||
                (e.keyCode >= 35 && e.keyCode <= 39)) return;
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    });

    // ============================
    // Deductions Input
    // ============================
    const deductionsInput = document.getElementById('tcDeductions');

    // Update retirement hint
    document.getElementById('tcTaxYear').addEventListener('change', function() {
        const year = getFallbackTaxDataYear(this.value);
        if (!year) return;
        const limit = TAX_DATA[year].retirementLimit;
        document.getElementById('tcRetHint').textContent = `Limit: ${fmt(limit)} for ${this.value}`;
    });

    // ============================
    // Advanced Options Toggle
    // ============================
    document.getElementById('tcAdvToggle').addEventListener('click', function() {
        const body = document.getElementById('tcAdvBody');
        body.classList.toggle('open');
        this.classList.toggle('active');
        this.querySelector('span').textContent = body.classList.contains('open') ? 'Hide Advanced Options' : 'Show Advanced Options';
    });

    // ============================
    // View Toggle
    // ============================
    function setView(view, btn) {
        currentView = view;
        document.querySelectorAll('.tc-view-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (lastResult) updateDisplayValues(lastResult);
    }

    // ============================
    // Main Calculate Function
    // ============================
    async function calculateTax() {
                // Validate
                const zipGroup = document.getElementById('tcZipGroup');
                const zipCode = document.getElementById('tcZipCode').value.trim();
                if (!/^\d{5}$/.test(zipCode)) {
                    zipGroup.classList.add('has-error');
                    document.getElementById('tcZipCode').focus();
                    return;
                }
                zipGroup.classList.remove('has-error');

        const incomeGroup = document.getElementById('tcIncomeGroup');
        const incomeRaw = parseNum(document.getElementById('tcIncome').value);
        if (incomeRaw <= 0) {
            incomeGroup.classList.add('has-error');
            document.getElementById('tcIncome').focus();
            return;
        }
        incomeGroup.classList.remove('has-error');

        // Gather inputs
        const year = document.getElementById('tcTaxYear').value;
        const status = document.getElementById('tcFilingStatus').value;
        const location = await getStateFromZip(zipCode);
        const customDeductions = parseNum(deductionsInput.value);
        const credits = parseNum(document.getElementById('tcCredits').value);
        const retirement = parseNum(document.getElementById('tcRetirement').value);
        const dependents = parseInt(document.getElementById('tcDependents').value) || 0;
        const adjustments = parseNum(document.getElementById('tcAdjustments').value);

        const dataYear = getFallbackTaxDataYear(year);
        const data = TAX_DATA[dataYear];
        const brackets = data.brackets[status];

        // Cap retirement
        const cappedRetirement = Math.min(retirement, data.retirementLimit);
        const dependentCredits = dependents * data.dependentCredit;

        // Calculations
        const grossIncome = incomeRaw;
        const totalPreTaxDeductions = cappedRetirement + adjustments;
        const deductionAmount = customDeductions;
        const totalDeductions = totalPreTaxDeductions + deductionAmount;
        const taxableIncome = Math.max(0, grossIncome - totalDeductions);
        const totalCredits = credits + dependentCredits;

        // Tax by bracket
        const bracketBreakdown = [];
        let totalTaxBeforeCredits = 0;
        let marginalRate = 0;

        for (const bracket of brackets) {
            if (taxableIncome <= bracket.min) {
                bracketBreakdown.push({
                    rate: bracket.rate,
                    min: bracket.min,
                    max: bracket.max === Infinity ? null : bracket.max,
                    incomeInBracket: 0,
                    tax: 0
                });
                continue;
            }
            const incomeInBracket = Math.min(taxableIncome, bracket.max === Infinity ? taxableIncome : bracket.max) - bracket.min;
            const tax = incomeInBracket * bracket.rate;
            bracketBreakdown.push({
                rate: bracket.rate,
                min: bracket.min,
                max: bracket.max === Infinity ? null : bracket.max,
                incomeInBracket: incomeInBracket,
                tax: tax
            });
            totalTaxBeforeCredits += tax;
            if (incomeInBracket > 0) marginalRate = bracket.rate;
        }

        const finalTax = Math.max(0, totalTaxBeforeCredits - totalCredits);
        const netIncome = grossIncome - finalTax;
        const effectiveRate = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0;
        const taxBurden = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0;

        // Calculate savings from deductions (tax on gross vs taxable)
        let taxWithoutDeductions = 0;
        const grossTaxable = Math.max(0, grossIncome - totalPreTaxDeductions);
        for (const bracket of brackets) {
            if (grossTaxable <= bracket.min) continue;
            const inc = Math.min(grossTaxable, bracket.max === Infinity ? grossTaxable : bracket.max) - bracket.min;
            taxWithoutDeductions += inc * bracket.rate;
        }
        const deductionSavings = Math.max(0, taxWithoutDeductions - totalTaxBeforeCredits);

        // Store result
        lastResult = {
            year, status, grossIncome, totalPreTaxDeductions,
            deductionAmount, totalDeductions, taxableIncome, bracketBreakdown,
            totalTaxBeforeCredits, totalCredits, dependentCredits, credits,
            finalTax, netIncome, effectiveRate, marginalRate, taxBurden,
            deductionSavings, cappedRetirement, dependents, adjustments,
            customDeductions, retirement, location, zipCode
        };

        // Display
        displayResults(lastResult);
    }

    // ============================
    // Display Results
    // ============================
    function displayResults(r) {
        const resultsEl = document.getElementById('tcResults');
        resultsEl.classList.add('show');

        // Re-init AOS for new elements
        setTimeout(() => AOS.refresh(), 50);

        // Scroll into view
        setTimeout(() => {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        updateDisplayValues(r);
        renderBracketTable(r);
        renderDetailTable(r);
        renderCharts(r);
    }

    function updateDisplayValues(r) {
        const isMonthly = currentView === 'monthly';
        const m = isMonthly ? monthly : (v) => v;
        const unit = isMonthly ? ' /month' : ' /year';
        const selectedYear = Number(r.year) || new Date().getFullYear();
        document.getElementById('tcSeasonNote').textContent = `Result - ${selectedYear}-${selectedYear + 1} filing season`;

        document.getElementById('tcResGross').textContent = fmt(m(r.grossIncome));
        document.getElementById('tcResGrossSub').textContent = '';

        document.getElementById('tcResTaxable').textContent = fmt(m(r.taxableIncome));
        document.getElementById('tcResTaxableSub').textContent = '';

        document.getElementById('tcResTax').textContent = fmt(m(r.finalTax));
        document.getElementById('tcResTaxSub').textContent = '';

        document.getElementById('tcResNet').textContent = fmt(m(r.netIncome));
        document.getElementById('tcResNetSub').textContent = '';

        document.getElementById('tcResRate').textContent = r.effectiveRate.toFixed(1) + '%';
        document.getElementById('tcResTakeHomeLabel').innerHTML = `<i class='bx bx-calendar'></i> ${isMonthly ? 'Monthly Take-Home' : 'Annual Take-Home'}`;
        document.getElementById('tcResMonthly').textContent = fmt(m(r.netIncome));
        document.getElementById('tcResBurden').textContent = r.taxBurden.toFixed(1) + '%';
        document.getElementById('tcResSavings').textContent = fmt(m(r.deductionSavings));

        // Highlight box follows selected view
        document.getElementById('tcHlTax').textContent = fmt(m(r.finalTax));
        document.getElementById('tcHlNet').textContent = fmt(m(r.netIncome));
        document.getElementById('tcHlNetSub').textContent = fmt(m(r.netIncome)) + unit;
        document.getElementById('tcHlMarginal').textContent = (r.marginalRate * 100).toFixed(0) + '%';

        const stateName = r.location && r.location.state ? r.location.state : 'Unknown';
        const pill = document.getElementById('tcStatePill');
        const mapFrame = document.getElementById('tcStateMap');
        pill.textContent = `State: ${stateName}`;

        const mapQuery = stateName === 'Unknown' ? `${r.zipCode}, United States` : `${stateName}, United States`;
        mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
    }

    // ============================
    // Bracket Table
    // ============================
    function renderBracketTable(r) {
        const tbody = document.getElementById('tcBracketBody');
        const maxTax = Math.max(...r.bracketBreakdown.map(b => b.tax), 1);
        const colors = ['#a8d8c0', '#7cc4a0', '#408A71', '#285A48', '#1e4538', '#16352b', '#0e2520'];
        const taxType = 'Federal';

        let html = '';
        r.bracketBreakdown.forEach((b, i) => {
            const range = b.max ? `${fmt(b.min)} – ${fmt(b.max)}` : `${fmt(b.min)}+`;
            const fillPct = maxTax > 0 ? (b.tax / maxTax * 100) : 0;
            html += `<tr>
                <td>${range}</td>
                <td>${taxType}</td>
                <td><span class="tc-badge-rate">${(b.rate * 100).toFixed(0)}%</span></td>
                <td>${b.incomeInBracket > 0 ? fmt(b.incomeInBracket) : '—'}</td>
                <td class="text-right">${b.tax > 0 ? fmt(b.tax) : '—'}</td>
                <td><div class="tc-bracket-bar"><div class="tc-bracket-bar-fill" style="width:${fillPct}%;background:${colors[i]};"></div></div></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

    // ============================
    // Detailed Table
    // ============================
    function renderDetailTable(r) {
        const tbody = document.getElementById('tcDetailBody');
        const rows = [
            { label: 'Annual Salary / Wages', value: fmt(r.grossIncome), bold: false },
            { label: 'Total Gross Income', value: fmt(r.grossIncome), bold: true },
            { label: '', value: '', bold: false, spacer: true },
            { label: 'Retirement Contributions (401k)', value: '- ' + fmt(r.cappedRetirement), bold: false },
            { label: 'Other Adjustments', value: '- ' + fmt(r.adjustments), bold: false },
            { label: 'Itemized Deductions', value: '- ' + fmt(r.deductionAmount), bold: false },
            { label: 'Total Deductions', value: '- ' + fmt(r.totalDeductions), bold: true },
            { label: '', value: '', bold: false, spacer: true },
            { label: 'Taxable Income', value: fmt(r.taxableIncome), bold: true },
            { label: 'Federal Income Tax (before credits)', value: fmt(r.totalTaxBeforeCredits), bold: false },
            { label: '', value: '', bold: false, spacer: true },
            { label: 'Tax Credits (manual)', value: '- ' + fmt(r.credits), bold: false },
            { label: `Child Tax Credits (${r.dependents} dependent${r.dependents !== 1 ? 's' : ''})`, value: '- ' + fmt(r.dependentCredits), bold: false },
            { label: 'Total Credits Applied', value: '- ' + fmt(r.totalCredits), bold: true },
            { label: '', value: '', bold: false, spacer: true },
            { label: 'Final Tax Liability', value: fmt(r.finalTax), bold: true, color: 'var(--tax-calculator-danger)' },
            { label: 'Net Annual Income', value: fmt(r.netIncome), bold: true, color: 'var(--tax-calculator-success)' },
        ];

        let html = '';
        rows.forEach(row => {
            if (row.spacer) {
                html += '<tr><td colspan="2" style="padding:4px 14px;border:none;"></td></tr>';
                return;
            }
            const cls = row.bold ? (row.label.includes('Total') || row.label.includes('Final') || row.label.includes('Net') || row.label === 'Taxable Income' ? 'tc-row-bold' : 'tc-row-subtotal') : '';
            const valStyle = row.color ? `color:${row.color};` : '';
            html += `<tr class="${cls}">
                <td>${row.label}</td>
                <td class="text-right" style="${valStyle}">${row.value}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

    // ============================
    // Charts
    // ============================
    function renderCharts(r) {
        // Destroy previous
        if (chartBracket) chartBracket.destroy();
        if (chartAllocation) chartAllocation.destroy();

        // Bracket Doughnut
        const bracketLabels = [];
        const bracketValues = [];
        const bracketColors = ['#a8d8c0', '#7cc4a0', '#408A71', '#285A48', '#1e4538', '#16352b', '#0e2520'];

        r.bracketBreakdown.forEach((b, i) => {
            if (b.tax > 0) {
                bracketLabels.push(`${(b.rate * 100).toFixed(0)}% bracket`);
                bracketValues.push(Math.round(b.tax));
            }
        });

        if (bracketValues.length === 0) {
            bracketLabels.push('No tax');
            bracketValues.push(1);
        }

        const ctx1 = document.getElementById('tcChartBracket').getContext('2d');
        chartBracket = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: bracketLabels,
                datasets: [{
                    data: bracketValues,
                    backgroundColor: bracketColors.slice(0, bracketValues.length),
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 14,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                            color: '#6b7280'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': ' + fmt(ctx.raw);
                            }
                        },
                        backgroundColor: '#1a1a2e',
                        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                        bodyFont: { family: 'Plus Jakarta Sans' },
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });

        // Allocation Bar
        const ctx2 = document.getElementById('tcChartAllocation').getContext('2d');
        chartAllocation = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Gross Income', 'Deductions', 'Federal Tax', 'Net Income'],
                datasets: [{
                    data: [
                        Math.round(r.grossIncome),
                        Math.round(r.totalDeductions),
                        Math.round(r.finalTax),
                        Math.round(r.netIncome)
                    ],
                    backgroundColor: ['#285A48', '#d1fae5', '#dc2626', '#408A71'],
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 36
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f3f4f6', drawBorder: false },
                        ticks: {
                            callback: v => fmt(v),
                            font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        grid: { display: false, drawBorder: false },
                        ticks: {
                            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                            color: '#374151'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return fmt(ctx.raw);
                            }
                        },
                        backgroundColor: '#1a1a2e',
                        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                        bodyFont: { family: 'Plus Jakarta Sans' },
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });
    }

    // ============================
    // Reset Form
    // ============================
    function resetForm() {
        document.getElementById('tcZipCode').value = '';
        document.getElementById('tcIncome').value = '';
        document.getElementById('tcDeductions').value = '';
        document.getElementById('tcCredits').value = '';
        document.getElementById('tcRetirement').value = '';
        document.getElementById('tcDependents').value = '0';
        document.getElementById('tcAdjustments').value = '';
        document.getElementById('tcTaxYear').value = String(new Date().getFullYear());
        document.getElementById('tcFilingStatus').value = 'single';

        // Close advanced
        document.getElementById('tcAdvBody').classList.remove('open');
        const advBtn = document.getElementById('tcAdvToggle');
        advBtn.classList.remove('active');
        advBtn.querySelector('span').textContent = 'Show Advanced Options';

        // Hide results
        document.getElementById('tcResults').classList.remove('show');
        lastResult = null;

        // Clear errors
        document.getElementById('tcZipGroup').classList.remove('has-error');
        document.getElementById('tcIncomeGroup').classList.remove('has-error');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================
    // Download Summary
    // ============================
    function downloadSummary() {
        if (!lastResult) {
            showToast('Please calculate tax first');
            return;
        }
        const statusMap = {
            single: 'Single',
            mfj: 'Married Filing Jointly',
            mfs: 'Married Filing Separately',
            hoh: 'Head of Household'
        };
        const reportDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const filingStatusLabel = statusMap[lastResult.status] || lastResult.status;
        const locationLabel = lastResult.location && lastResult.location.state ? lastResult.location.state : 'Unknown';

        const breakdownRows = lastResult.bracketBreakdown
            .map(b => {
                const range = b.max ? `${fmt(b.min)} - ${fmt(b.max)}` : `${fmt(b.min)}+`;
                return `<tr>
                    <td>${range}</td>
                    <td>Federal</td>
                    <td>${(b.rate * 100).toFixed(0)}%</td>
                    <td style="text-align:right;">${b.incomeInBracket > 0 ? fmt(b.incomeInBracket) : '—'}</td>
                    <td style="text-align:right;">${b.tax > 0 ? fmt(b.tax) : '—'}</td>
                </tr>`;
            })
            .join('');
        const detailedRows = `
                <tr><th>Annual Salary / Wages</th><td style="text-align:right;">${fmt(lastResult.grossIncome)}</td></tr>
                <tr><th>Total Gross Income</th><td style="text-align:right;">${fmt(lastResult.grossIncome)}</td></tr>
                <tr><th>Retirement Contributions (401k)</th><td style="text-align:right;">- ${fmt(lastResult.cappedRetirement)}</td></tr>
                <tr><th>Other Adjustments</th><td style="text-align:right;">- ${fmt(lastResult.adjustments)}</td></tr>
                <tr><th>Itemized Deductions</th><td style="text-align:right;">- ${fmt(lastResult.deductionAmount)}</td></tr>
                <tr><th>Total Deductions</th><td style="text-align:right;">- ${fmt(lastResult.totalDeductions)}</td></tr>
                <tr><th>Taxable Income</th><td style="text-align:right;">${fmt(lastResult.taxableIncome)}</td></tr>
                <tr><th>Federal Income Tax (before credits)</th><td style="text-align:right;">${fmt(lastResult.totalTaxBeforeCredits)}</td></tr>
                <tr><th>Tax Credits (manual)</th><td style="text-align:right;">- ${fmt(lastResult.credits)}</td></tr>
                <tr><th>Child Tax Credits (${lastResult.dependents} dependent${lastResult.dependents !== 1 ? 's' : ''})</th><td style="text-align:right;">- ${fmt(lastResult.dependentCredits)}</td></tr>
                <tr><th>Total Credits Applied</th><td style="text-align:right;">- ${fmt(lastResult.totalCredits)}</td></tr>
                <tr><th>Final Tax Liability</th><td style="text-align:right;">${fmt(lastResult.finalTax)}</td></tr>
                <tr><th>Net Annual Income</th><td style="text-align:right;">${fmt(lastResult.netIncome)}</td></tr>
                <tr><th>Deduction Savings (Estimated)</th><td style="text-align:right;">${fmt(lastResult.deductionSavings)}</td></tr>
                <tr><th>Monthly Take-Home</th><td style="text-align:right;">${fmt(monthly(lastResult.netIncome))}</td></tr>
        `;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Report</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            background: #ffffff;
        }
        .report {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .title {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            color: #285A48;
        }
        .subtitle {
            margin: 6px 0 0;
            font-size: 12px;
            color: #6b7280;
        }
        .meta {
            margin-top: 12px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 16px;
            font-size: 12px;
        }
        .meta div { padding: 6px 8px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; }
        .section-title {
            margin: 20px 0 10px;
            font-size: 15px;
            font-weight: 700;
            color: #111827;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 6px;
        }
        .kpi {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .kpi .label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 6px;
        }
        .kpi .value {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 12px;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
        }
        th {
            background: #f3f4f6;
            text-align: left;
            font-weight: 700;
        }
        .note {
            margin-top: 16px;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-left: 4px solid #285A48;
            border-radius: 6px;
            background: #f9fafb;
            font-size: 11px;
            color: #4b5563;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="report">
        <div class="header">
            <h1 class="title">U.S. Income Tax Report</h1>
            <p class="subtitle">Generated on ${reportDate}</p>
            <div class="meta">
                <div><strong>Tax Year:</strong> ${lastResult.year}</div>
                <div><strong>Filing Status:</strong> ${filingStatusLabel}</div>
                <div><strong>ZIP Code:</strong> ${lastResult.zipCode}</div>
                <div><strong>State:</strong> ${locationLabel}</div>
            </div>
        </div>

        <h2 class="section-title">Summary</h2>
        <div class="kpi-grid">
            <div class="kpi"><span class="label">Gross Income</span><span class="value">${fmt(lastResult.grossIncome)}</span></div>
            <div class="kpi"><span class="label">Taxable Income</span><span class="value">${fmt(lastResult.taxableIncome)}</span></div>
            <div class="kpi"><span class="label">Federal Tax Liability</span><span class="value">${fmt(lastResult.finalTax)}</span></div>
            <div class="kpi"><span class="label">Net Income</span><span class="value">${fmt(lastResult.netIncome)}</span></div>
            <div class="kpi"><span class="label">Effective Tax Rate</span><span class="value">${lastResult.effectiveRate.toFixed(1)}%</span></div>
            <div class="kpi"><span class="label">Marginal Tax Rate</span><span class="value">${(lastResult.marginalRate * 100).toFixed(0)}%</span></div>
        </div>

        <h2 class="section-title">Tax Bracket Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Bracket Range</th>
                    <th>Tax Type</th>
                    <th>Rate</th>
                    <th style="text-align:right;">Taxable in Bracket</th>
                    <th style="text-align:right;">Tax Amount</th>
                </tr>
            </thead>
            <tbody>
                ${breakdownRows || '<tr><td colspan="4" style="text-align:center;">No taxable amount in brackets</td></tr>'}
            </tbody>
        </table>

        <h2 class="section-title">Detailed Figures</h2>
        <table>
            <tbody>
                ${detailedRows}
            </tbody>
        </table>

        <div class="note">
            This estimate is for informational purposes only and does not constitute tax advice.
            Federal-only estimates are shown; actual tax may vary based on additional rules and local/state regulations.
        </div>
    </div>
</body>
</html>`;

        const existingFrame = document.getElementById('tcPrintFrame');
        if (existingFrame) existingFrame.remove();

        const printFrame = document.createElement('iframe');
        printFrame.id = 'tcPrintFrame';
        printFrame.setAttribute('title', 'Tax report print frame');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);

        printFrame.onload = function() {
            const frameWindow = printFrame.contentWindow;
            if (!frameWindow) {
                showToast('Unable to prepare PDF view');
                printFrame.remove();
                return;
            }

            const cleanup = () => {
                setTimeout(() => {
                    if (document.getElementById('tcPrintFrame')) {
                        printFrame.remove();
                    }
                }, 300);
            };

            frameWindow.onafterprint = cleanup;
            frameWindow.focus();
            showToast('Professional PDF view ready. Select Save as PDF');
            setTimeout(() => {
                try {
                    frameWindow.print();
                } finally {
                    setTimeout(cleanup, 4000);
                }
            }, 150);
        };

        printFrame.srcdoc = html;
    }

    // ============================
    // Save Calculation
    // ============================
    function saveCalculation() {
        if (!lastResult) return;
        const saveData = {
            timestamp: new Date().toISOString(),
            inputs: {
                zipCode: document.getElementById('tcZipCode').value,
                year: document.getElementById('tcTaxYear').value,
                status: document.getElementById('tcFilingStatus').value,
                income: document.getElementById('tcIncome').value,
                deductions: deductionsInput.value,
                credits: document.getElementById('tcCredits').value,
                retirement: document.getElementById('tcRetirement').value,
                dependents: document.getElementById('tcDependents').value,
                adjustments: document.getElementById('tcAdjustments').value
            },
            results: {
                grossIncome: lastResult.grossIncome,
                taxableIncome: lastResult.taxableIncome,
                totalTax: lastResult.finalTax,
                netIncome: lastResult.netIncome,
                effectiveRate: lastResult.effectiveRate,
                marginalRate: lastResult.marginalRate
            }
        };
        localStorage.setItem('tc_saved_calc', JSON.stringify(saveData));
        showToast('Calculation saved to browser storage');
    }

    // ============================
    // Scroll to Form
    // ============================
    function scrollToForm() {
        document.querySelector('.tc-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ============================
    // Toast
    // ============================
    function showToast(msg) {
        const toast = document.getElementById('tcToast');
        document.getElementById('tcToastMsg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ============================
    // Load Saved Calculation
    // ============================
    function loadSavedCalc() {
        const saved = localStorage.getItem('tc_saved_calc');
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            const inp = data.inputs;
            document.getElementById('tcZipCode').value = inp.zipCode || '';
            document.getElementById('tcTaxYear').value = inp.year || String(new Date().getFullYear());
            document.getElementById('tcFilingStatus').value = inp.status || 'single';
            document.getElementById('tcIncome').value = inp.income || '';
            deductionsInput.value = inp.deductions || '';
            document.getElementById('tcCredits').value = inp.credits || '';
            document.getElementById('tcRetirement').value = inp.retirement || '';
            document.getElementById('tcDependents').value = inp.dependents || '0';
            document.getElementById('tcAdjustments').value = inp.adjustments || '';
            updateZipStateHint(document.getElementById('tcZipCode').value.trim());
        } catch (e) { /* ignore */ }
    }

    // ============================
    // Enter key to calculate
    // ============================
    document.querySelectorAll('.tc-form-body input, .tc-form-body select').forEach(el => {
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateTax();
            }
        });
    });

    // ZIP input: digits only
    document.getElementById('tcZipCode').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 5);
        updateZipStateHint(this.value);
    });

    // ============================
    // Init
    // ============================
    AOS.init({
        duration: 600,
        easing: 'ease-out-cubic',
        once: true,
        offset: 40
    });

    populateTaxYearOptions();
    loadSavedCalc();
