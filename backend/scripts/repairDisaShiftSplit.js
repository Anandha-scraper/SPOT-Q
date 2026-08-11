// One-off repair for reports forked by the missing-shift write bug (see
// backend.md's 2026-08-10 entry). Read-only by default; pass --apply to write.
const { prisma } = require('../database/prisma');

const CHILD_MODELS = [
    'disaProductionEntry',
    'disaNextShiftPlanEntry',
    'disaDelayEntry',
    'disaMouldHardnessEntry',
    'disaPatternTempEntry',
];

async function childCounts(reportId) {
    const counts = {};
    for (const model of CHILD_MODELS) {
        counts[model.replace('disa', '').replace('Entry', '')] =
            await prisma[model].count({ where: { disaReportId: reportId } });
    }
    counts.members = await prisma.disaReportMember.count({ where: { disaReportId: reportId } });
    return counts;
}

const total = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);

async function main() {
    const apply = process.argv.includes('--apply');

    const phantoms = await prisma.disaReport.findMany({
        where: { shift: '' },
        orderBy: { date: 'asc' },
    });

    if (!phantoms.length) {
        console.log('No shift="" reports found. Nothing to repair.');
        return;
    }

    console.log(`Found ${phantoms.length} report(s) with a blank shift.\n`);

    const plan = [];
    for (const phantom of phantoms) {
        const siblings = await prisma.disaReport.findMany({
            where: { date: phantom.date, shift: { not: '' } },
            orderBy: { shift: 'asc' },
        });
        const counts = await childCounts(phantom.id);

        if (siblings.length === 1) {
            plan.push({ phantom, target: siblings[0], counts });
            console.log(`  ${phantom.date}  MERGE -> shift "${siblings[0].shift}"  ${JSON.stringify(counts)}`);
        } else {
            const shifts = siblings.map((s) => s.shift).join(', ') || 'none';
            console.log(`  ${phantom.date}  SKIP  ${siblings.length} real shift(s) [${shifts}]  ${JSON.stringify(counts)}`);
        }
    }

    const emptyOnly = plan.filter((p) => total(p.counts) === 0).length;
    console.log(`\nmergeable: ${plan.length} (${emptyOnly} carry no rows — delete-only)`);
    console.log(`skipped:   ${phantoms.length - plan.length}`);

    if (!apply) {
        console.log('\nRead-only. Re-run with --apply to perform the merge.');
        return;
    }

    for (const { phantom, target } of plan) {
        await prisma.$transaction(async (tx) => {
            for (const model of CHILD_MODELS) {
                await tx[model].updateMany({
                    where: { disaReportId: phantom.id },
                    data: { disaReportId: target.id },
                });
            }
            // Members are written only by savePrimary, which always carried a real
            // shift, so anything here is a duplicate and goes with the shell.
            await tx.disaReportMember.deleteMany({ where: { disaReportId: phantom.id } });
            await tx.disaReport.delete({ where: { id: phantom.id } });
        });
        console.log(`  merged ${phantom.date} -> "${target.shift}"`);
    }

    console.log(`\nDone. ${plan.length} report(s) merged.`);
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
