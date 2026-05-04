import { getEmployees } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncRemonlineEmployees() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineEmployees' });

  const { employees } = await getEmployees();

  devLog({ message: `Fetched ${employees.length} employees from Remonline` });

  let upserted = 0;

  for (const employee of employees) {
    const data = {
      email: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      notes: employee.notes,
      phone: employee.phone,
      deleted: employee.deleted,
      position: employee.position,
      createdAt: BigInt(employee.created_at),
      startedWork: BigInt(employee.started_work),
      avatar: employee.avatar,
    };

    await prisma.employee.upsert({
      where: { id: employee.id },
      create: { id: employee.id, ...data },
      update: data,
    });

    upserted++;
  }

  devLog({ message: `Upserted ${upserted} employees` });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineEmployees in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineEmployees();
}
