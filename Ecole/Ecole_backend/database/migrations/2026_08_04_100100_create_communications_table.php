<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Announcements — the school's noticeboard.
 *
 * The Communications page existed with no table behind it. The feature had to be
 * designed, and the two questions that needed answering were *who sees this*
 * and *for how long*.
 *
 * ## Audience: one discriminator, one target
 *
 * An announcement is addressed to exactly one of four audiences, named by
 * `audience`, with the matching target column carrying the detail:
 *
 *   ecole   → everybody in the establishment          (no target)
 *   cycle   → one cycle                               `audience_cycle`
 *   classe  → one class, and the families attached    `classe_id`
 *   role    → one role, e.g. all teachers             `audience_role`
 *
 * A discriminated union in one table rather than a polymorphic recipients pivot:
 * the audience is a *rule* evaluated against the reader, not a list of people.
 * A pivot would have to be rewritten every time a pupil changes class or a
 * teacher is hired, and an announcement to "all parents" would silently stop
 * reaching parents enrolled after it was published.
 *
 * ## Validity: a window, not a flag
 *
 * `publie_le` and `expire_le` bound when the announcement is in force. Both are
 * nullable and mean different things:
 *
 *   - `publie_le` NULL or in the past → in force now. A future value schedules
 *     it, which is what a term-opening notice needs.
 *   - `expire_le` NULL → no expiry, for a standing rule. A date makes it lapse
 *     on its own, which is what a canteen closure or a deadline needs.
 *
 * A boolean `published` flag would need somebody to come back and unset it. The
 * window needs nobody: an expired notice leaves the feed by itself, and the row
 * survives for the record. That is why expiry is not a delete.
 *
 * ## No cycle scope on this table
 *
 * `classe_id` reaches a class, so `ScopedToCycle` looks like it applies. It must
 * not: the column is nullable by design and most announcements are school-wide,
 * while the trait filters with `whereIn(classe_id, …)`, which NULL never
 * satisfies. Adopting it would hide every school-wide announcement from the
 * three cycle heads — a regression dressed up as a boundary. The cycle rule is
 * enforced where it is expressible instead: on write, a cycle head may only
 * target their own cycle or a class within it (`CommunicationsController`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();

            // restrictOnDelete, never cascade: a school is deactivated, not
            // deleted (2026_08_03_100000_restrict_school_deletion).
            $table->foreignId('ecole_id')->constrained('ecoles')->restrictOnDelete();

            // `nullOnDelete`, pas `cascadeOnDelete` : `User` est en suppression
            // dure, donc la cascade effaçait *toutes* les annonces d'un membre du
            // personnel au moment où l'on supprimait son compte. Une annonce est
            // un enregistrement de l'établissement, pas la propriété de son
            // auteur — elle survit, sans attribution.
            $table->foreignId('auteur_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('titre');
            $table->text('contenu');

            // important | info | event — matches the frontend's CATEGORY_CONFIG.
            $table->string('categorie')->default('info');

            // ecole | cycle | classe | role, and the target for each.
            $table->string('audience')->default('ecole');
            $table->string('audience_cycle')->nullable();
            $table->string('audience_role')->nullable();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->cascadeOnDelete();

            $table->json('tags')->nullable();
            $table->boolean('epingle')->default(false);

            $table->timestamp('publie_le')->nullable();
            $table->timestamp('expire_le')->nullable();

            $table->timestamps();

            // The feed reads: this school, in force, pinned first, newest
            // first. One composite index covers the filter and the ordering.
            $table->index(['ecole_id', 'publie_le'], 'communications_school_published_index');
            $table->index(['ecole_id', 'audience'], 'communications_school_audience_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
