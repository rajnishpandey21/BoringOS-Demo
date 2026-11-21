# BORING OS

**Boring Company’s browser-based agency workspace.** Serious about operations. Unreasonably unboring about everything else.

All creators, clients, rates, campaign records, payments, and reported metrics are synthetic. The workspace clock is fixed at 21 November 2026. Changes are saved in the current browser and origin through versioned local storage. Optional web fonts have local fallbacks.

## Preview

Run this from the project folder in PowerShell.

```powershell
Set-Location 'C:\Users\RAJNISHPANDEY\Desktop\TBC'
python -m http.server 5500 --bind 127.0.0.1
```

Open [http://127.0.0.1:5500/](http://127.0.0.1:5500/) in a browser. The project uses native ES modules and needs no package installation. For GitHub Pages, publish the folder containing `index.html`. Asset paths are relative.

## Five-minute demo

1. **Command Center.** Open an active campaign, then click **Overdue tasks** to see the filtered board. Press **Ctrl+K** or **⌘K** to search the workspace.
2. **Creator Universe and Partner Network.** Search for **Aarohi Negi** and open **View source options**. Compare the expired low quote with the recommended eligible offer. Open **Northstar Collective** and run **Simulate demo import** twice. The first run adds three offers to existing identities. The second adds zero.
3. **Smart Sourcing.** Click **Load Dehradun demo**. The original fixtures give 10 direct-eligible and nine partner-only eligible creators, with six places unfilled. The Northstar import from step 2 adds two eligible identities to the results by supplying them with valid offers. Scroll down to review **Excluded offers**, then select another eligible supplier on a row with multiple options and review the commercial summary.
4. **Quote and campaign.** Preview the client quote, close it with **Escape**, and choose **Create Campaign from Shortlist**. The campaign and draft quote appear immediately. Set an allocation to **Confirmed**, then open its linked deliverable and move it to **Review** or **Client Approved** to see approval and campaign status changes.
5. **Content Studio and Money & Metrics.** Advance a task, toggle an invoice payment, and check the reporting totals. Adjust the pricing calculator, then refresh to check that record changes persist. Use **Settings → Reset Demo Data** to restore the original fixtures.

## Validation

Run the dependency-free checks on Node 22.7 or later.

```powershell
node qa.mjs
```

The checks cover fixture counts and references, canonical identities, rate eligibility, shortlist uniqueness and budgets, client quote fields, pricing, pipeline and dashboard changes, payments, repeat imports, corrupt-storage recovery, HTML escaping, and rendering functions for all seven destinations.

Use this browser checklist alongside the automated checks.

- Navigate the seven destinations with the mouse and keyboard. Test the mobile navigation and check that wide tables scroll inside their panels.
- Stack creator filters, change the sort, export CSV, and check that the exported record count matches the directory.
- Submit a sourcing brief with a mismatched platform and deliverable, then check validation. Use a low buying ceiling and manually select enough creators to exceed the budget. Campaign creation should be disabled until the shortlist is within budget.
- Select a different supplier for a confirmed allocation. Cancel once, then confirm. The supplier, buying rate, and payable update while the client’s agreed unit price remains fixed. Settled supplier payments block reassignment.
- Open a quote through Smart Sourcing and through Money & Metrics. Each preview should display client pricing and deliverables only. Check that typing HTML into a campaign title displays it as text.
- Move tasks forward and backward, approve a deliverable, record demo insights after publishing the campaign’s deliverables, and verify the pipeline. Check role and employee filters.
- Change payment and allocation statuses, reload, then reset. Check that seeded campaign, offer, and creator counts return to 8, 75, and 50.

## Calculation conventions

- Source eligibility uses the fixed demo date and requested campaign date, comparable deliverable and organic terms, availability, exclusivity, and the per-offer budget ceiling. Shortlist creation also enforces the aggregate ceiling.
- Markup is applied to buying cost. Gross margin divides gross profit by selling revenue. Unit prices round to whole INR.
- Projected financials include selected creator snapshots and production costs. Committed costs use confirmed allocations and planned production costs. Recorded paid receivables and supplier payables drive realized revenue and actual supplier costs.
- Agency fees and pass-through ad spend are displayed separately. Reported reach sums platform figures across posts and may contain overlapping audiences.
- Calendar, roles, insights, inventory import, and payment changes are simulations. There are no live account connections, transactions, or backend services.
