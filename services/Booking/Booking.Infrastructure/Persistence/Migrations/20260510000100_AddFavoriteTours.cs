using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoriteTours : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "favorite_tours",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_favorite_tours", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_favorite_tours_TourId",
                table: "favorite_tours",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_favorite_tours_UserId_TourId",
                table: "favorite_tours",
                columns: new[] { "UserId", "TourId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_favorite_tours_UserId",
                table: "favorite_tours",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "favorite_tours");
        }
    }
}
