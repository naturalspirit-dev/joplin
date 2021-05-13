import { ShareType, ShareUserStatus } from '../../db';
import { beforeAllDb, afterAllTests, beforeEachDb, createUserAndSession, models, createItemTree, expectHttpError } from '../../utils/testing/testUtils';
import { getApi, patchApi } from '../../utils/testing/apiUtils';
import { shareWithUserAndAccept } from '../../utils/testing/shareApiUtils';
import { ErrorForbidden } from '../../utils/errors';
import { PaginatedResults } from '../../models/utils/pagination';

describe('share_users', function() {

	beforeAll(async () => {
		await beforeAllDb('share_users');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	test('should list user invitations', async function() {
		const { user: user1, session: session1 } = await createUserAndSession(1);
		const { user: user2, session: session2 } = await createUserAndSession(2);

		await createItemTree(user1.id, '', {
			'000000000000000000000000000000F1': {},
			'000000000000000000000000000000F2': {},
		});
		const folderItem1 = await models().item().loadByJopId(user1.id, '000000000000000000000000000000F1');
		const folderItem2 = await models().item().loadByJopId(user1.id, '000000000000000000000000000000F2');
		const { share: share1 } = await shareWithUserAndAccept(session1.id, session2.id, user2, ShareType.JoplinRootFolder, folderItem1);
		const { share: share2 } = await shareWithUserAndAccept(session1.id, session2.id, user2, ShareType.JoplinRootFolder, folderItem2);

		const shareUsers = await getApi<PaginatedResults>(session2.id, 'share_users');
		expect(shareUsers.items.length).toBe(2);
		expect(shareUsers.items.find(su => su.share.id === share1.id)).toBeTruthy();
		expect(shareUsers.items.find(su => su.share.id === share2.id)).toBeTruthy();
	});

	test('should not change someone else shareUser object', async function() {
		const { user: user1, session: session1 } = await createUserAndSession(1);
		const { user: user2, session: session2 } = await createUserAndSession(2);

		await createItemTree(user1.id, '', { '000000000000000000000000000000F1': {} });
		const folderItem = await models().item().loadByJopId(user1.id, '000000000000000000000000000000F1');
		const { shareUser } = await shareWithUserAndAccept(session1.id, session2.id, user2, ShareType.JoplinRootFolder, folderItem);

		// User can modify own UserShare object
		await patchApi(session2.id, `share_users/${shareUser.id}`, { status: ShareUserStatus.Rejected });

		// User cannot modify someone else UserShare object
		await expectHttpError(async () => patchApi(session1.id, `share_users/${shareUser.id}`, { status: ShareUserStatus.Accepted }), ErrorForbidden.httpCode);
	});

});
