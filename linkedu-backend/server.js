/**
 * LinkEdu Hub -- Backend server (Node.js + Sequelize + MS SQL Server)
 * Author: Haran Ivan, group IK-33
 *
 * Run:    node server.js
 * Setup:  npm install sequelize tedious
 */

const sequelize = require('./config/Database');
const User      = require('./models/User');
const Resource  = require('./models/Resource');

// ── 1. One-to-Many relationship: User hasMany Resources ──────────────────────
User.hasMany(Resource, { foreignKey: 'created_by', as: 'resources' });
Resource.belongsTo(User, { foreignKey: 'created_by', as: 'author' });

// ── 2. Main function ──────────────────────────────────────────────────────────
async function main() {
  try {
    // Check connection
    await sequelize.authenticate();
    console.log('\n✅ Connected to MS SQL Server!\n');

    // Sync models (does not recreate existing tables)
    await sequelize.sync({ force: false });
    console.log('✅ Models synced with database\n');

    // ── INSERT: Create user (findOrCreate avoids duplicate errors) ────────────
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: 'ivan@linkedu.ua' },
      defaults: {
        username:      'admin_ivan',
        password_hash: 'hashed_Vanygar962',
        role:          'admin',
      }
    });
    console.log(`✅ User: ${admin.username} (id=${admin.user_id}) | ${adminCreated ? 'created' : 'already exists'}`);

    // ── INSERT: Create resources ──────────────────────────────────────────────
    const [res1, res1Created] = await Resource.findOrCreate({
      where: { title: 'JavaScript and TypeScript: Complete Guide' },
      defaults: {
        url:        'https://example.com/js-ts',
        description:'Comprehensive course on modern JavaScript and TypeScript',
        type:       'course',
        status:     'learning',
        created_by: admin.user_id,
      }
    });

    const [res2, res2Created] = await Resource.findOrCreate({
      where: { title: 'Design Patterns in IT' },
      defaults: {
        url:        'https://example.com/patterns',
        description:'Classic GoF patterns with examples',
        type:       'article',
        status:     'learned',
        created_by: admin.user_id,
      }
    });

    console.log(`✅ Resource: "${res1.title}" | ${res1Created ? 'created' : 'already exists'}`);
    console.log(`✅ Resource: "${res2.title}" | ${res2Created ? 'created' : 'already exists'}\n`);

    // ── SELECT: Get all resources ─────────────────────────────────────────────
    console.log('─── SELECT: All resources ──────────────────────────────────────');
    const allResources = await Resource.findAll();
    allResources.forEach(r =>
      console.log(`  [${r.resource_id}] ${r.title} | type: ${r.type} | status: ${r.status}`)
    );

    // ── SELECT with JOIN: Resources with author ───────────────────────────────
    console.log('\n─── SELECT JOIN: Resources with author ─────────────────────────');
    const withAuthor = await Resource.findAll({
      include: [{ model: User, as: 'author', attributes: ['username', 'email'] }],
    });
    withAuthor.forEach(r =>
      console.log(`  "${r.title}" -- author: ${r.author?.username}`)
    );

    // ── SELECT: All resources of a specific user ──────────────────────────────
    console.log('\n─── SELECT: Resources of admin ─────────────────────────────────');
    const adminWithResources = await User.findByPk(admin.user_id, {
      include: [{ model: Resource, as: 'resources' }],
    });
    adminWithResources.resources.forEach(r =>
      console.log(`  - ${r.title} (${r.type})`)
    );

    // ── UPDATE: Change resource status ────────────────────────────────────────
    console.log('\n─── UPDATE: Change status of first resource ────────────────────');
    await Resource.update(
      { status: 'learned' },
      { where: { resource_id: res1.resource_id } }
    );
    const updated = await Resource.findByPk(res1.resource_id);
    console.log(`  New status of "${updated.title}": ${updated.status}`);

    // ── DELETE: Remove a resource ─────────────────────────────────────────────
    console.log('\n─── DELETE: Remove second resource ─────────────────────────────');
    await Resource.destroy({ where: { resource_id: res2.resource_id } });
    const remaining = await Resource.findAll();
    console.log(`  Resources remaining in DB: ${remaining.length}`);

    console.log('\n✅ All CRUD operations completed successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed.');
  }
}

main();