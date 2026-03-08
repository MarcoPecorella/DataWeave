import { AfterViewInit, Component, TemplateRef, ViewChild, computed, signal } from '@angular/core';
import {
  DwGridComponent,
  GridColumnDef,
  GridContextMenuConfig,
  GridColumnOrder,
  GridColumnVisibility,
  GridPaginationConfig,
  GridSelectionType
} from 'data-weave';

interface DemoRow {
  id: number;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  region: string;
  revenue: number;
  [key: string]: string | number;
}

@Component({
  selector: 'app-root',
  imports: [DwGridComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('DataWeave');
  readonly isDark = signal(false);

  @ViewChild('statusTemplate', { static: true }) statusTemplate?: TemplateRef<unknown>;

  readonly rowCountOptions = [50, 200, 500, 1500, 5000, 10000] as const;
  readonly rowCount = signal<number>(500);

  readonly rows = computed<DemoRow[]>(() => this.buildRows(this.rowCount()));

  columns: GridColumnDef<DemoRow>[] = [];
  selectionType: GridSelectionType = 'multi';
  readonly pagination = signal<GridPaginationConfig>({ enabled: false, pageSize: 50, pageIndex: 0 });
  readonly columnOrder = signal<GridColumnOrder>([]);
  readonly columnVisibility = signal<GridColumnVisibility>({});
  readonly contextMenu: GridContextMenuConfig<DemoRow> = {
    items: [
      {
        id: 'copy-name',
        label: 'Copy account name',
        action: (ctx) => navigator.clipboard?.writeText(ctx.row.name)
      },
      {
        id: 'flag',
        label: 'Flag account',
        action: (ctx) => alert(`Flagged ${ctx.row.name}`)
      },
      {
        id: 'disabled',
        label: 'Disabled action',
        disabled: true
      }
    ]
  };

  ngAfterViewInit(): void {
    const baseColumns: GridColumnDef<DemoRow>[] = [
      { id: 'id', header: 'ID', width: 70, sortable: true },
      { id: 'name', header: 'Account', width: 200, sortable: true },
      { id: 'status', header: 'Status', width: 120, cellTemplate: this.statusTemplate as TemplateRef<any> },
      { id: 'region', header: 'Region', width: 120, sortable: true },
      {
        id: 'revenue',
        header: 'Monthly Revenue',
        width: 160,
        sortable: true,
        editable: true,
        valueFormatter: (value) => `$${Number(value).toLocaleString()}`
      }
    ];
    const extraCount = 40;
    const extraColumns: GridColumnDef<DemoRow>[] = Array.from({ length: extraCount }, (_, index) => ({
      id: `extra${index + 1}`,
      header: `Extra ${index + 1}`,
      width: 120,
      sortable: true
    }));
    this.columns = [...baseColumns, ...extraColumns];
    this.columnOrder.set(this.columns.map((col) => col.id));
    const visibility: GridColumnVisibility = {};
    for (const col of this.columns) visibility[col.id] = true;
    this.columnVisibility.set(visibility);
  }

  setRowCount(value: number): void {
    this.rowCount.set(value);
    this.pagination.set({ ...this.pagination(), pageIndex: 0 });
  }

  toggleTheme(): void {
    this.isDark.set(!this.isDark());
  }

  toggleColumn(id: string): void {
    const current = { ...this.columnVisibility() };
    current[id] = !current[id];
    this.columnVisibility.set(current);
  }

  moveColumn(id: string, direction: -1 | 1): void {
    const order = [...this.columnOrder()];
    const index = order.indexOf(id);
    const nextIndex = index + direction;
    if (index === -1 || nextIndex < 0 || nextIndex >= order.length) return;
    const [item] = order.splice(index, 1);
    order.splice(nextIndex, 0, item);
    this.columnOrder.set(order);
  }

  trackRow = (_: number, row: DemoRow): number => row.id;

  formatCell(row: DemoRow, col: GridColumnDef<DemoRow>): string {
    const value = col.valueGetter ? col.valueGetter(row) : (row as any)[col.id];
    return col.valueFormatter ? col.valueFormatter(value, row) : value == null ? '' : String(value);
  }

  private buildRows(count: number): DemoRow[] {
    const regions = ['North', 'South', 'West', 'East'];
    const rows: DemoRow[] = [];
    for (let index = 0; index < count; index += 1) {
      const row: DemoRow = {
        id: index + 1,
        name: `Account ${index + 1}`,
        status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Paused' : 'Draft',
        region: regions[index % regions.length],
        revenue: Math.round(12000 + (index % 60) * 137)
      };
      for (let extra = 1; extra <= 40; extra += 1) {
        row[`extra${extra}`] = `V-${index + 1}-${extra}`;
      }
      rows.push(row);
    }
    return rows;
  }
}
