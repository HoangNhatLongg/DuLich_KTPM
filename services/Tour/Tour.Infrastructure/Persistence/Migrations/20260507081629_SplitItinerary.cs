using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tour.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitItinerary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "itineraries");

            migrationBuilder.AddColumn<string>(
                name: "Afternoon",
                table: "itineraries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Evening",
                table: "itineraries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Morning",
                table: "itineraries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Noon",
                table: "itineraries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Afternoon",
                table: "itineraries");

            migrationBuilder.DropColumn(
                name: "Evening",
                table: "itineraries");

            migrationBuilder.DropColumn(
                name: "Morning",
                table: "itineraries");

            migrationBuilder.DropColumn(
                name: "Noon",
                table: "itineraries");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "itineraries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");
        }
    }
}
