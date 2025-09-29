type TableData = {
	headers: string[];
	rows: string[][];
};

export function extractTableDataFromElement(tableElement: HTMLElement): TableData {
	const headers: string[] = [];
	const rows: string[][] = [];

	// Extract headers
	const headerCells = tableElement.querySelectorAll('thead th');
	for (const cell of headerCells) {
		headers.push(cell.textContent?.trim() || '');
	}

	// Extract rows
	const bodyRows = tableElement.querySelectorAll('tbody tr');
	for (const row of bodyRows) {
		const rowData: string[] = [];
		const cells = row.querySelectorAll('td');
		for (const cell of cells) {
			rowData.push(cell.textContent?.trim() || '');
		}
		rows.push(rowData);
	}

	return { headers, rows };
}

export function tableDataToCSV(data: TableData): string {
	const { headers, rows } = data;

	const escapeCSV = (value: string): string => {
		// If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
		if (value.includes(',') || value.includes('"') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	};

	const csvRows: string[] = [];

	// Add headers
	if (headers.length > 0) {
		csvRows.push(headers.map(escapeCSV).join(','));
	}

	// Add data rows
	for (const row of rows) {
		csvRows.push(row.map(escapeCSV).join(','));
	}

	return csvRows.join('\n');
}

export function tableDataToMarkdown(data: TableData): string {
	const { headers, rows } = data;

	if (headers.length === 0) {
		return '';
	}

	const markdownRows: string[] = [];

	// Add headers
	const escapedHeaders = headers.map((h) => h.replace(/\|/g, '\\|'));
	markdownRows.push(`| ${escapedHeaders.join(' | ')} |`);

	// Add separator row
	markdownRows.push(`| ${headers.map(() => '---').join(' | ')} |`);

	// Add data rows
	for (const row of rows) {
		// Pad row with empty strings if it's shorter than headers
		const paddedRow = [...row];
		while (paddedRow.length < headers.length) {
			paddedRow.push('');
		}
		const escapedRow = paddedRow.map((cell) => cell.replace(/\|/g, '\\|'));
		markdownRows.push(`| ${escapedRow.join(' | ')} |`);
	}

	return markdownRows.join('\n');
}
